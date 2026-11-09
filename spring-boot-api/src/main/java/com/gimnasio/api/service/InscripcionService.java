package com.gimnasio.api.service;

import com.gimnasio.api.dto.request.InscripcionRequestDTO;
import com.gimnasio.api.dto.response.InscripcionResponseDTO;
import com.gimnasio.api.entity.*;
import com.gimnasio.api.exception.AccesoDenegadoException;
import com.gimnasio.api.exception.BusinessException;
import com.gimnasio.api.exception.DuplicateResourceException;
import com.gimnasio.api.exception.ResourceNotFoundException;
import com.gimnasio.api.mapper.InscripcionMapper;
import com.gimnasio.api.repository.InscripcionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InscripcionService {

    private final InscripcionRepository inscripcionRepository;
    private final SocioService socioService;
    private final ClaseService claseService;
    private final MembresiaService membresiaService;

    @Transactional(readOnly = true)
    public List<InscripcionResponseDTO> listar() {
        return inscripcionRepository.findAllByOrderByIdDesc().stream().map(InscripcionMapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<InscripcionResponseDTO> mias(Usuario actual) {
        Socio socio = socioService.obtenerPorUsuario(actual);
        return inscripcionRepository.findBySocioId(socio.getId()).stream().map(InscripcionMapper::toResponse).toList();
    }

    /**
     * SOCIO: se inscribe a sí mismo (se ignora socioId).
     * ADMIN / RECEPCIONISTA: deben indicar socioId.
     */
    @Transactional
    public InscripcionResponseDTO crear(InscripcionRequestDTO dto, Usuario actual) {
        Socio socio;
        if (actual.getRol() == Rol.SOCIO) {
            socio = socioService.obtenerPorUsuario(actual);
        } else {
            if (dto.socioId() == null) {
                throw new BusinessException("Debe indicar el id del socio (socioId) que se va a inscribir");
            }
            socio = socioService.obtenerEntidad(dto.socioId());
        }
        socioService.validarSocioActivo(socio);
        Clase clase = claseService.obtenerEntidad(dto.claseId());

        if (inscripcionRepository.existsBySocioIdAndClaseId(socio.getId(), clase.getId())) {
            throw new DuplicateResourceException("El socio ya está inscrito en la clase '" + clase.getNombre() + "'");
        }
        if (!membresiaService.tieneMembresiaVigente(socio.getId())) {
            throw new BusinessException("El socio no tiene una membresía activa y vigente. No puede inscribirse en clases");
        }
        if (inscripcionRepository.countByClaseId(clase.getId()) >= clase.getCupoMaximo()) {
            throw new BusinessException("La clase '" + clase.getNombre() + "' ya alcanzó su máximo de "
                    + clase.getCupoMaximo() + " participantes");
        }
        // El socio no puede estar en dos clases al mismo tiempo
        for (Inscripcion otra : inscripcionRepository.findBySocioIdAndClaseDiaSemana(socio.getId(), clase.getDiaSemana())) {
            Clase c = otra.getClase();
            if (clase.getHoraInicio().isBefore(c.getHoraFin()) && clase.getHoraFin().isAfter(c.getHoraInicio())) {
                throw new BusinessException("El socio ya está inscrito en '" + c.getNombre() + "' el " + c.getDiaSemana()
                        + " de " + c.getHoraInicio() + " a " + c.getHoraFin() + ", que se cruza con esta clase");
            }
        }

        Inscripcion inscripcion = new Inscripcion();
        inscripcion.setSocio(socio);
        inscripcion.setClase(clase);
        return InscripcionMapper.toResponse(inscripcionRepository.save(inscripcion));
    }

    /** Cancelar: el propio SOCIO, ADMIN o RECEPCIONISTA. Libera el cupo. */
    @Transactional
    public void eliminar(Long id, Usuario actual) {
        Inscripcion inscripcion = inscripcionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inscripción", id));
        if (actual.getRol() == Rol.SOCIO && !inscripcion.getSocio().getUsuario().getId().equals(actual.getId())) {
            throw new AccesoDenegadoException("Un socio solo puede cancelar sus propias inscripciones");
        }
        inscripcionRepository.delete(inscripcion);
    }
}
