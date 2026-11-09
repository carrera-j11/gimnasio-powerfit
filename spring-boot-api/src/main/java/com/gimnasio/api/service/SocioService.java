package com.gimnasio.api.service;

import com.gimnasio.api.dto.request.SocioUpdateDTO;
import com.gimnasio.api.dto.response.SocioResponseDTO;
import com.gimnasio.api.entity.*;
import com.gimnasio.api.exception.AccesoDenegadoException;
import com.gimnasio.api.exception.BusinessException;
import com.gimnasio.api.exception.ResourceNotFoundException;
import com.gimnasio.api.mapper.SocioMapper;
import com.gimnasio.api.repository.InscripcionRepository;
import com.gimnasio.api.repository.MembresiaRepository;
import com.gimnasio.api.repository.SocioRepository;
import com.gimnasio.api.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Los socios se crean al registrarse (POST /api/auth/registro) y un ADMIN los aprueba.
 * Aquí se consultan, editan y eliminan.
 */
@Service
@RequiredArgsConstructor
public class SocioService {

    private final SocioRepository socioRepository;
    private final UsuarioRepository usuarioRepository;
    private final UsuarioAdminService usuarioAdminService;
    private final MembresiaRepository membresiaRepository;
    private final InscripcionRepository inscripcionRepository;

    /** Solo socios con cuenta APROBADA (los pendientes se revisan en /api/admin/usuarios). */
    @Transactional(readOnly = true)
    public List<SocioResponseDTO> listar() {
        return socioRepository.findByUsuarioEstadoOrderByIdAsc(EstadoCuenta.APROBADA).stream()
                .map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public SocioResponseDTO buscarPorId(Long id, Usuario actual) {
        Socio socio = obtenerEntidad(id);
        validarAcceso(socio, actual);
        return toResponse(socio);
    }

    @Transactional(readOnly = true)
    public SocioResponseDTO buscarPorCedula(String cedula) {
        Socio socio = socioRepository.findByUsuarioCedula(cedula)
                .orElseThrow(() -> new ResourceNotFoundException("No existe un socio con la cédula " + cedula));
        return toResponse(socio);
    }

    @Transactional(readOnly = true)
    public SocioResponseDTO miPerfil(Usuario actual) {
        return toResponse(obtenerPorUsuario(actual));
    }

    /** ADMIN y RECEPCIONISTA editan cualquier socio; un SOCIO solo sus propios datos. */
    @Transactional
    public SocioResponseDTO actualizar(Long id, SocioUpdateDTO dto, Usuario actual) {
        Socio socio = obtenerEntidad(id);
        validarAcceso(socio, actual);
        Usuario u = socio.getUsuario();
        usuarioAdminService.validarCelularDisponible(dto.celular(), u.getId());
        u.setNombres(dto.nombres().trim());
        u.setApellidos(dto.apellidos().trim());
        u.setCelular(dto.celular().trim());
        socio.setObjetivo(dto.objetivo() == null || dto.objetivo().isBlank() ? null : dto.objetivo().trim());
        usuarioRepository.save(u);
        return toResponse(socioRepository.save(socio));
    }

    /** Elimina el socio y su cuenta, solo si no tiene membresías ni inscripciones. */
    @Transactional
    public void eliminar(Long id) {
        Socio socio = obtenerEntidad(id);
        if (membresiaRepository.existsBySocioId(id) || inscripcionRepository.existsBySocioId(id)) {
            throw new BusinessException("No se puede eliminar el socio porque tiene membresías o inscripciones registradas");
        }
        Usuario usuario = socio.getUsuario();
        socioRepository.delete(socio);
        usuarioRepository.delete(usuario);
    }

    // ---------------------------------------------------------------- uso interno

    public Socio obtenerEntidad(Long id) {
        return socioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Socio", id));
    }

    public Socio obtenerPorUsuario(Usuario usuario) {
        return socioRepository.findByUsuarioId(usuario.getId())
                .orElseThrow(() -> new ResourceNotFoundException("El usuario actual no tiene un perfil de socio"));
    }

    /** El socio debe tener la cuenta aprobada para operar (membresías, inscripciones). */
    public void validarSocioActivo(Socio socio) {
        if (socio.getUsuario().getEstado() != EstadoCuenta.APROBADA) {
            throw new BusinessException("La cuenta del socio " + socio.getUsuario().getNombreCompleto()
                    + " no está aprobada (estado: " + socio.getUsuario().getEstado() + ")");
        }
    }

    private void validarAcceso(Socio socio, Usuario actual) {
        if (actual.getRol() == Rol.SOCIO && !socio.getUsuario().getId().equals(actual.getId())) {
            throw new AccesoDenegadoException("Un socio solo puede ver y editar sus propios datos");
        }
    }

    private SocioResponseDTO toResponse(Socio s) {
        LocalDate hoy = LocalDate.now();
        boolean vigente = membresiaRepository
                .existsBySocioIdAndEstadoAndFechaInicioLessThanEqualAndFechaFinGreaterThanEqual(
                        s.getId(), EstadoMembresia.ACTIVA, hoy, hoy);
        return SocioMapper.toResponse(s, vigente);
    }
}
