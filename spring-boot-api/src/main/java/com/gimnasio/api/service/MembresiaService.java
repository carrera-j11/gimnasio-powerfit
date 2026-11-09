package com.gimnasio.api.service;

import com.gimnasio.api.dto.request.MembresiaRequestDTO;
import com.gimnasio.api.dto.request.MembresiaUpdateDTO;
import com.gimnasio.api.dto.response.MembresiaResponseDTO;
import com.gimnasio.api.entity.*;
import com.gimnasio.api.exception.AccesoDenegadoException;
import com.gimnasio.api.exception.BusinessException;
import com.gimnasio.api.exception.ResourceNotFoundException;
import com.gimnasio.api.mapper.MembresiaMapper;
import com.gimnasio.api.repository.MembresiaRepository;
import com.gimnasio.api.repository.PagoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MembresiaService {

    private static final int MAX_DIAS_ANTICIPACION = 30;

    private final MembresiaRepository membresiaRepository;
    private final PagoRepository pagoRepository;
    private final SocioService socioService;
    private final PlanMembresiaService planService;

    @Transactional
    public List<MembresiaResponseDTO> listar() {
        return membresiaRepository.findAllByOrderByIdDesc().stream()
                .peek(this::actualizarSiVencio).map(this::toResponse).toList();
    }

    @Transactional
    public List<MembresiaResponseDTO> listarPorSocio(Long socioId) {
        socioService.obtenerEntidad(socioId);
        return membresiaRepository.findBySocioIdOrderByIdDesc(socioId).stream()
                .peek(this::actualizarSiVencio).map(this::toResponse).toList();
    }

    /** El SOCIO consulta sus propias membresías. */
    @Transactional
    public List<MembresiaResponseDTO> mias(Usuario actual) {
        Socio socio = socioService.obtenerPorUsuario(actual);
        return membresiaRepository.findBySocioIdOrderByIdDesc(socio.getId()).stream()
                .peek(this::actualizarSiVencio).map(this::toResponse).toList();
    }

    @Transactional
    public MembresiaResponseDTO buscarPorId(Long id, Usuario actual) {
        Membresia m = obtenerEntidad(id);
        if (actual.getRol() == Rol.SOCIO && !m.getSocio().getUsuario().getId().equals(actual.getId())) {
            throw new AccesoDenegadoException("Un socio solo puede ver sus propias membresías");
        }
        return toResponse(m);
    }

    /** ADMIN o RECEPCIONISTA crean la membresía de un socio. */
    @Transactional
    public MembresiaResponseDTO crear(MembresiaRequestDTO dto) {
        Socio socio = socioService.obtenerEntidad(dto.socioId());
        return crearPara(socio, dto.tipoPlan(), dto.fechaInicio());
    }

    /** El SOCIO contrata su propia membresía (el socio se toma del token, no del body). */
    @Transactional
    public MembresiaResponseDTO contratar(MembresiaUpdateDTO dto, Usuario actual) {
        Socio socio = socioService.obtenerPorUsuario(actual);
        return crearPara(socio, dto.tipoPlan(), dto.fechaInicio());
    }

    private MembresiaResponseDTO crearPara(Socio socio, TipoPlan tipoPlan, LocalDate fechaInicio) {
        socioService.validarSocioActivo(socio);
        PlanMembresia plan = planService.obtenerPorTipo(tipoPlan);

        LocalDate inicio = fechaInicio != null ? fechaInicio : LocalDate.now();
        validarFechaInicio(inicio);
        if (membresiaRepository.existsBySocioIdAndEstadoAndFechaFinGreaterThanEqual(
                socio.getId(), EstadoMembresia.ACTIVA, inicio)) {
            throw new BusinessException("El socio " + socio.getUsuario().getNombreCompleto()
                    + " ya tiene una membresía activa en esa fecha");
        }

        Membresia nueva = new Membresia();
        nueva.setSocio(socio);
        nueva.setPlan(plan);
        nueva.setFechaInicio(inicio);
        nueva.setFechaFin(inicio.plusDays(plan.getDuracionDias()));
        nueva.setEstado(EstadoMembresia.ACTIVA);
        return toResponse(membresiaRepository.save(nueva));
    }

    /** Cambia el plan o la fecha de inicio (se recalcula la fecha de fin). */
    @Transactional
    public MembresiaResponseDTO actualizar(Long id, MembresiaUpdateDTO dto) {
        Membresia m = obtenerEntidad(id);
        if (m.getEstado() != EstadoMembresia.ACTIVA) {
            throw new BusinessException("Solo se pueden modificar membresías ACTIVAS (estado actual: " + m.getEstado() + ")");
        }
        PlanMembresia plan = planService.obtenerPorTipo(dto.tipoPlan());
        if (plan.getTipo() != m.getPlan().getTipo() && pagoRepository.existsByMembresiaId(id)) {
            throw new BusinessException("No se puede cambiar el plan porque la membresía ya tiene pagos registrados");
        }
        LocalDate inicio = dto.fechaInicio() != null ? dto.fechaInicio() : m.getFechaInicio();
        if (!inicio.equals(m.getFechaInicio())) {
            validarFechaInicio(inicio);
        }
        m.setPlan(plan);
        m.setFechaInicio(inicio);
        m.setFechaFin(inicio.plusDays(plan.getDuracionDias()));
        return toResponse(membresiaRepository.save(m));
    }

    @Transactional
    public MembresiaResponseDTO cancelar(Long id) {
        Membresia m = obtenerEntidad(id);
        if (m.getEstado() == EstadoMembresia.CANCELADA) {
            throw new BusinessException("La membresía ya se encuentra cancelada");
        }
        m.setEstado(EstadoMembresia.CANCELADA);
        return toResponse(membresiaRepository.save(m));
    }

    @Transactional
    public void eliminar(Long id) {
        Membresia m = obtenerEntidad(id);
        if (pagoRepository.existsByMembresiaId(id)) {
            throw new BusinessException("No se puede eliminar la membresía porque tiene pagos registrados. Puede cancelarla en su lugar");
        }
        membresiaRepository.delete(m);
    }

    // ---------------------------------------------------------------- uso interno

    public Membresia obtenerEntidad(Long id) {
        Membresia m = membresiaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Membresía", id));
        actualizarSiVencio(m);
        return m;
    }

    public boolean tieneMembresiaVigente(Long socioId) {
        LocalDate hoy = LocalDate.now();
        return membresiaRepository.existsBySocioIdAndEstadoAndFechaInicioLessThanEqualAndFechaFinGreaterThanEqual(
                socioId, EstadoMembresia.ACTIVA, hoy, hoy);
    }

    private void validarFechaInicio(LocalDate inicio) {
        LocalDate hoy = LocalDate.now();
        if (inicio.isBefore(hoy)) {
            throw new BusinessException("La fecha de inicio no puede ser anterior a hoy");
        }
        if (inicio.isAfter(hoy.plusDays(MAX_DIAS_ANTICIPACION))) {
            throw new BusinessException("La fecha de inicio no puede ser más de " + MAX_DIAS_ANTICIPACION + " días en el futuro");
        }
    }

    /** Si la fecha de fin ya pasó, la membresía pasa a VENCIDA automáticamente. */
    private void actualizarSiVencio(Membresia m) {
        if (m.getEstado() == EstadoMembresia.ACTIVA && m.getFechaFin().isBefore(LocalDate.now())) {
            m.setEstado(EstadoMembresia.VENCIDA);
        }
    }

    private MembresiaResponseDTO toResponse(Membresia m) {
        return MembresiaMapper.toResponse(m, pagoRepository.totalPagado(m.getId()));
    }
}
