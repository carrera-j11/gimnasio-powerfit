package com.gimnasio.api.service;

import com.gimnasio.api.dto.request.ClaseRequestDTO;
import com.gimnasio.api.dto.response.ClaseResponseDTO;
import com.gimnasio.api.dto.response.InscripcionResponseDTO;
import com.gimnasio.api.entity.Clase;
import com.gimnasio.api.entity.Entrenador;
import com.gimnasio.api.entity.EstadoCuenta;
import com.gimnasio.api.entity.Rol;
import com.gimnasio.api.entity.Usuario;
import com.gimnasio.api.exception.AccesoDenegadoException;
import com.gimnasio.api.exception.BusinessException;
import com.gimnasio.api.exception.ResourceNotFoundException;
import com.gimnasio.api.mapper.ClaseMapper;
import com.gimnasio.api.mapper.InscripcionMapper;
import com.gimnasio.api.repository.ClaseRepository;
import com.gimnasio.api.repository.InscripcionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;

/** Las clases las crea el ADMIN (indicando el entrenador) o el propio ENTRENADOR; cada una tiene un cupo máximo. */
@Service
@RequiredArgsConstructor
public class ClaseService {

    // Horario de atención del gimnasio y duración permitida de una clase
    private static final LocalTime APERTURA = LocalTime.of(6, 0);
    private static final LocalTime CIERRE = LocalTime.of(22, 0);
    private static final int DURACION_MINIMA = 30;
    private static final int DURACION_MAXIMA = 180;

    private static final Comparator<Clase> POR_HORARIO =
            Comparator.comparing(Clase::getDiaSemana).thenComparing(Clase::getHoraInicio);

    private final ClaseRepository claseRepository;
    private final InscripcionRepository inscripcionRepository;
    private final EntrenadorService entrenadorService;

    @Transactional(readOnly = true)
    public List<ClaseResponseDTO> listar() {
        return claseRepository.findAll().stream().sorted(POR_HORARIO).map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public ClaseResponseDTO buscarPorId(Long id) {
        return toResponse(obtenerEntidad(id));
    }

    /** El ENTRENADOR consulta las clases que él creó. */
    @Transactional(readOnly = true)
    public List<ClaseResponseDTO> mias(Usuario actual) {
        Entrenador entrenador = entrenadorService.obtenerPorUsuario(actual);
        return claseRepository.findByEntrenadorId(entrenador.getId()).stream()
                .sorted(POR_HORARIO).map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<InscripcionResponseDTO> inscritos(Long claseId, Usuario actual) {
        Clase clase = obtenerEntidad(claseId);
        validarDueno(clase, actual, "ver los inscritos de");
        return inscripcionRepository.findByClaseId(claseId).stream().map(InscripcionMapper::toResponse).toList();
    }

    @Transactional
    public ClaseResponseDTO crear(ClaseRequestDTO dto, Usuario actual) {
        Entrenador entrenador = actual.getRol() == Rol.ENTRENADOR
                ? entrenadorService.obtenerPorUsuario(actual)
                : entrenadorEncargado(dto.entrenadorId());
        validarHorario(dto, entrenador.getId(), null);

        Clase clase = new Clase();
        copiar(clase, dto);
        clase.setEntrenador(entrenador);
        return toResponse(claseRepository.save(clase));
    }

    @Transactional
    public ClaseResponseDTO actualizar(Long id, ClaseRequestDTO dto, Usuario actual) {
        Clase clase = obtenerEntidad(id);
        validarDueno(clase, actual, "modificar");
        // El ADMIN puede cambiar el entrenador encargado; un ENTRENADOR no
        Entrenador entrenador = actual.getRol() != Rol.ENTRENADOR && dto.entrenadorId() != null
                ? entrenadorEncargado(dto.entrenadorId())
                : clase.getEntrenador();
        validarHorario(dto, entrenador.getId(), id);

        long inscritos = inscripcionRepository.countByClaseId(id);
        if (dto.cupoMaximo() < inscritos) {
            throw new BusinessException("El cupo no puede ser menor a los " + inscritos + " socios ya inscritos");
        }
        copiar(clase, dto);
        clase.setEntrenador(entrenador);
        return toResponse(claseRepository.save(clase));
    }

    /** El entrenador dueño o un ADMIN pueden eliminarla, solo si no tiene inscritos. */
    @Transactional
    public void eliminar(Long id, Usuario actual) {
        Clase clase = obtenerEntidad(id);
        validarDueno(clase, actual, "eliminar");
        if (inscripcionRepository.existsByClaseId(id)) {
            throw new BusinessException("No se puede eliminar la clase porque tiene socios inscritos");
        }
        claseRepository.delete(clase);
    }

    public Clase obtenerEntidad(Long id) {
        return claseRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Clase", id));
    }

    // ---------------------------------------------------------------- privados

    /** El ADMIN debe indicar qué entrenador (con cuenta APROBADA) dicta la clase. */
    private Entrenador entrenadorEncargado(Long entrenadorId) {
        if (entrenadorId == null) {
            throw new BusinessException("Debe indicar el entrenador encargado de la clase (entrenadorId). "
                    + "Cada clase tiene siempre un entrenador");
        }
        Entrenador entrenador = entrenadorService.obtenerEntidad(entrenadorId);
        if (entrenador.getUsuario().getEstado() != EstadoCuenta.APROBADA) {
            throw new BusinessException("El entrenador " + entrenador.getUsuario().getNombreCompleto()
                    + " no tiene la cuenta aprobada (estado: " + entrenador.getUsuario().getEstado() + ")");
        }
        return entrenador;
    }

    /** Un ENTRENADOR solo opera sobre sus propias clases. ADMIN y RECEPCIONISTA pueden ver todas. */
    private void validarDueno(Clase clase, Usuario actual, String accion) {
        if (actual.getRol() == Rol.ENTRENADOR
                && !clase.getEntrenador().getUsuario().getId().equals(actual.getId())) {
            throw new AccesoDenegadoException("Solo puede " + accion + " las clases que usted creó");
        }
    }

    /**
     * Reglas de horario:
     * 1) Fin posterior al inicio; 2) dentro del horario del gimnasio (06:00 - 22:00);
     * 3) duración entre 30 y 180 minutos; 4) el entrenador no puede tener dos clases cruzadas (un entrenador por clase y por horario).
     */
    private void validarHorario(ClaseRequestDTO dto, Long entrenadorId, Long idActual) {
        if (!dto.horaFin().isAfter(dto.horaInicio())) {
            throw new BusinessException("La hora de fin debe ser posterior a la hora de inicio");
        }
        if (dto.horaInicio().isBefore(APERTURA) || dto.horaFin().isAfter(CIERRE)) {
            throw new BusinessException("La clase debe estar dentro del horario del gimnasio (" + APERTURA + " a " + CIERRE + ")");
        }
        long minutos = Duration.between(dto.horaInicio(), dto.horaFin()).toMinutes();
        if (minutos < DURACION_MINIMA || minutos > DURACION_MAXIMA) {
            throw new BusinessException("La clase debe durar entre " + DURACION_MINIMA + " y " + DURACION_MAXIMA
                    + " minutos (duración actual: " + minutos + ")");
        }
        for (Clase otra : claseRepository.findByEntrenadorIdAndDiaSemana(entrenadorId, dto.diaSemana())) {
            if (otra.getId().equals(idActual)) {
                continue;
            }
            boolean seCruzan = dto.horaInicio().isBefore(otra.getHoraFin()) && dto.horaFin().isAfter(otra.getHoraInicio());
            if (seCruzan) {
                throw new BusinessException("Ya tiene la clase '" + otra.getNombre() + "' el " + otra.getDiaSemana()
                        + " de " + otra.getHoraInicio() + " a " + otra.getHoraFin());
            }
        }
    }

    private void copiar(Clase clase, ClaseRequestDTO dto) {
        clase.setNombre(dto.nombre().trim());
        clase.setDescripcion(dto.descripcion() == null || dto.descripcion().isBlank() ? null : dto.descripcion().trim());
        clase.setDiaSemana(dto.diaSemana());
        clase.setHoraInicio(dto.horaInicio());
        clase.setHoraFin(dto.horaFin());
        clase.setCupoMaximo(dto.cupoMaximo());
    }

    private ClaseResponseDTO toResponse(Clase c) {
        return ClaseMapper.toResponse(c, inscripcionRepository.countByClaseId(c.getId()));
    }
}
