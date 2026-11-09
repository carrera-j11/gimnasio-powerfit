package com.gimnasio.api.service;

import com.gimnasio.api.dto.request.RevisionUsuarioDTO;
import com.gimnasio.api.dto.request.UsuarioCrearRequestDTO;
import com.gimnasio.api.dto.response.UsuarioResponseDTO;
import com.gimnasio.api.entity.*;
import com.gimnasio.api.exception.AccesoDenegadoException;
import com.gimnasio.api.exception.BusinessException;
import com.gimnasio.api.exception.DuplicateResourceException;
import com.gimnasio.api.exception.ResourceNotFoundException;
import com.gimnasio.api.mapper.UsuarioMapper;
import com.gimnasio.api.repository.EntrenadorRepository;
import com.gimnasio.api.repository.SocioRepository;
import com.gimnasio.api.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

/** Gestión de cuentas por parte del ADMIN: crear, revisar (aprobar / rechazar) y consultar. */
@Service
@RequiredArgsConstructor
public class UsuarioAdminService {

    public static final int MAX_RECEPCIONISTAS = 5;
    /** Máximo de administradores contando al principal (aprobados o pendientes). */
    public static final int MAX_ADMINISTRADORES = 3;
    public static final int DECISION_APROBAR = 1;
    public static final int DECISION_RECHAZAR = 2;

    private static final int EDAD_MINIMA_SOCIO = 15;
    private static final int EDAD_MINIMA_PERSONAL = 18;
    private static final int EDAD_MAXIMA = 100;
    private static final List<Rol> ROLES_PERSONAL = List.of(Rol.ADMIN, Rol.RECEPCIONISTA, Rol.ENTRENADOR);
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UsuarioRepository usuarioRepository;
    private final SocioRepository socioRepository;
    private final EntrenadorRepository entrenadorRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Value("${app.verificacion.minutos-expiracion}")
    private int minutosExpiracion;

    @Value("${app.verificacion.max-intentos}")
    private int maxIntentos;

    /** El administrador principal es el que se crea al arrancar (DataInitializer). */
    @Value("${app.admin.email}")
    private String emailAdminPrincipal;

    @Transactional(readOnly = true)
    public List<UsuarioResponseDTO> listar(EstadoCuenta estado, Rol rol) {
        return usuarioRepository.findAll().stream()
                .filter(u -> estado == null || u.getEstado() == estado)
                .filter(u -> rol == null || u.getRol() == rol)
                .sorted(Comparator.comparing(Usuario::getId))
                .map(this::toResponse)
                .toList();
    }

    /** Cuentas que ya verificaron su correo y esperan la revisión del ADMIN. */
    @Transactional(readOnly = true)
    public List<UsuarioResponseDTO> pendientes() {
        return usuarioRepository.findByEstadoInOrderByIdAsc(List.of(EstadoCuenta.PENDIENTE_APROBACION)).stream()
                .map(this::toResponse).toList();
    }

    /** Personal que ya trabaja en el gimnasio: ADMIN, RECEPCIONISTAS y ENTRENADORES con cuenta APROBADA. */
    @Transactional(readOnly = true)
    public List<UsuarioResponseDTO> personal() {
        return usuarioRepository.findByEstadoAndRolInOrderByIdAsc(EstadoCuenta.APROBADA, ROLES_PERSONAL).stream()
                .map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public UsuarioResponseDTO buscarPorId(Long id) {
        return toResponse(obtener(id));
    }

    /**
     * El ADMIN agrega un SOCIO, ENTRENADOR, RECEPCIONISTA o ADMIN. Igual que en el registro, la cuenta
     * queda PENDIENTE_VERIFICACION y se envía el código al correo de la persona.
     * Un nuevo ADMIN solo lo puede aprobar el administrador principal.
     */
    @Transactional
    public UsuarioResponseDTO crear(UsuarioCrearRequestDTO dto) {
        String email = dto.email().trim().toLowerCase();
        validarNuevaCuenta(dto.cedula(), email, dto.celular(), dto.rol(), dto.fechaNacimiento(), dto.especialidad());

        Usuario usuario = new Usuario();
        usuario.setCedula(dto.cedula().trim());
        usuario.setNombres(dto.nombres().trim());
        usuario.setApellidos(dto.apellidos().trim());
        usuario.setEmail(email);
        usuario.setCelular(dto.celular().trim());
        usuario.setFechaNacimiento(dto.fechaNacimiento());
        usuario.setPassword(passwordEncoder.encode(dto.password()));
        usuario.setRol(dto.rol());
        usuario.setEstado(EstadoCuenta.PENDIENTE_VERIFICACION);
        String codigo = asignarNuevoCodigo(usuario);
        usuarioRepository.save(usuario);

        crearPerfil(usuario, dto.especialidad(), dto.objetivo());

        // Si el correo falla (y no está el plan B) se lanza EmailException y se deshace todo
        emailService.enviarCodigoVerificacion(usuario, codigo, minutosExpiracion);
        return toResponse(usuario);
    }

    /**
     * Cuando la persona ya verificó su correo, el ADMIN aprueba (1) o rechaza (2) la cuenta
     * y se le envía un correo con sus datos, su id y el resultado.
     */
    @Transactional
    public UsuarioResponseDTO revisar(Long id, RevisionUsuarioDTO dto, Usuario admin) {
        Usuario usuario = obtener(id);
        if (usuario.getId().equals(admin.getId())) {
            throw new BusinessException("No puede revisar su propia cuenta");
        }
        if (usuario.getRol() == Rol.ADMIN && !esAdminPrincipal(admin)) {
            throw new AccesoDenegadoException("Solo el administrador principal (" + emailAdminPrincipal
                    + ") puede aprobar o rechazar a un nuevo administrador");
        }
        if (usuario.getEstado() == EstadoCuenta.PENDIENTE_VERIFICACION) {
            throw new BusinessException("La persona todavía no ha verificado su correo; no se puede revisar la cuenta");
        }
        if (usuario.getEstado() != EstadoCuenta.PENDIENTE_APROBACION) {
            throw new BusinessException("Solo se revisan cuentas pendientes (estado actual: " + usuario.getEstado() + ")");
        }

        boolean aprobada = dto.decision() == DECISION_APROBAR;
        if (aprobada) {
            usuario.setEstado(EstadoCuenta.APROBADA);
            usuario.setMotivoRechazo(null);
            usuario.setFechaAprobacion(LocalDateTime.now());
            // La fecha de ingreso del entrenador / afiliación del socio es la de aprobación
            socioRepository.findByUsuarioId(id).ifPresent(s -> s.setFechaAfiliacion(LocalDate.now()));
            entrenadorRepository.findByUsuarioId(id).ifPresent(e -> e.setFechaIngreso(LocalDate.now()));
        } else {
            usuario.setEstado(EstadoCuenta.RECHAZADA);
            usuario.setMotivoRechazo(dto.motivo() == null || dto.motivo().isBlank()
                    ? "Solicitud no aprobada por el administrador" : dto.motivo().trim());
        }
        usuarioRepository.save(usuario);

        emailService.enviarResultadoRevision(usuario, perfilId(usuario));
        return toResponse(usuario);
    }

    /**
     * Elimina solicitudes NO aprobadas (pendientes o rechazadas) junto con su perfil.
     * Las solicitudes de ADMIN solo las puede eliminar el administrador principal.
     */
    @Transactional
    public void eliminar(Long id, Usuario admin) {
        Usuario usuario = obtener(id);
        if (usuario.getRol() == Rol.ADMIN && !esAdminPrincipal(admin)) {
            throw new AccesoDenegadoException("Solo el administrador principal puede eliminar la solicitud de un administrador");
        }
        if (usuario.getEstado() == EstadoCuenta.APROBADA) {
            throw new BusinessException("Una cuenta APROBADA no se elimina aquí; elimine el socio o entrenador desde su módulo");
        }
        socioRepository.findByUsuarioId(id).ifPresent(socioRepository::delete);
        entrenadorRepository.findByUsuarioId(id).ifPresent(entrenadorRepository::delete);
        usuarioRepository.delete(usuario);
    }

    // ---------------------------------------------------------------- reglas compartidas con el registro

    /**
     * Reglas para cualquier cuenta nueva (registro público o creada por el ADMIN):
     * especialidad del entrenador, edad, máximo de recepcionistas y de administradores, y
     * cédula / email / celular únicos (una persona solo puede tener una cuenta y un rol).
     */
    public void validarNuevaCuenta(String cedula, String email, String celular, Rol rol,
                                   LocalDate fechaNacimiento, String especialidad) {
        if (rol == Rol.ENTRENADOR && (especialidad == null || especialidad.trim().length() < 3)) {
            throw new BusinessException("Para el rol ENTRENADOR debe indicar la especialidad (mínimo 3 caracteres)");
        }
        int edad = UsuarioMapper.edad(fechaNacimiento);
        int minima = rol == Rol.SOCIO ? EDAD_MINIMA_SOCIO : EDAD_MINIMA_PERSONAL;
        if (edad < minima) {
            throw new BusinessException("Para el rol " + rol + " la edad mínima es " + minima + " años (tiene " + edad + ")");
        }
        if (edad > EDAD_MAXIMA) {
            throw new BusinessException("La fecha de nacimiento no es válida (edad mayor a " + EDAD_MAXIMA + " años)");
        }
        validarDatosUnicos(cedula.trim(), email, celular.trim());
        if (rol == Rol.RECEPCIONISTA
                && usuarioRepository.countByRolAndEstadoNot(Rol.RECEPCIONISTA, EstadoCuenta.RECHAZADA) >= MAX_RECEPCIONISTAS) {
            throw new BusinessException("El gimnasio ya tiene el máximo de " + MAX_RECEPCIONISTAS
                    + " recepcionistas (aprobadas o pendientes). Rechace o elimine una antes de agregar otra");
        }
        if (rol == Rol.ADMIN
                && usuarioRepository.countByRolAndEstadoNot(Rol.ADMIN, EstadoCuenta.RECHAZADA) >= MAX_ADMINISTRADORES) {
            throw new BusinessException("El gimnasio ya tiene el máximo de " + MAX_ADMINISTRADORES
                    + " administradores (contando al principal, aprobados o pendientes)");
        }
    }

    /** ¿Es el administrador principal? Es el único que aprueba o rechaza a nuevos administradores. */
    public boolean esAdminPrincipal(Usuario u) {
        return u.getRol() == Rol.ADMIN && u.getEmail().equalsIgnoreCase(emailAdminPrincipal.trim());
    }

    /** Genera un código de 6 dígitos con su expiración y reinicia los intentos. */
    public String asignarNuevoCodigo(Usuario usuario) {
        String codigo = String.format("%06d", RANDOM.nextInt(1_000_000));
        usuario.setCodigoVerificacion(codigo);
        usuario.setCodigoExpiracion(LocalDateTime.now().plusMinutes(minutosExpiracion));
        usuario.setIntentosVerificacion(0);
        return codigo;
    }

    /** Al editar datos: el celular no puede pertenecer a otra persona. */
    public void validarCelularDisponible(String celular, Long usuarioId) {
        if (usuarioRepository.existsByCelularAndIdNot(celular.trim(), usuarioId)) {
            throw new DuplicateResourceException("El celular " + celular.trim() + " ya está registrado por otra persona");
        }
    }

    /** Crea el perfil según el rol. Devuelve su id (null para RECEPCIONISTA). */
    public Long crearPerfil(Usuario usuario, String especialidad, String objetivo) {
        if (usuario.getRol() == Rol.SOCIO) {
            Socio socio = new Socio();
            socio.setUsuario(usuario);
            socio.setObjetivo(objetivo == null || objetivo.isBlank() ? null : objetivo.trim());
            socio.setFechaAfiliacion(LocalDate.now());
            return socioRepository.save(socio).getId();
        }
        if (usuario.getRol() == Rol.ENTRENADOR) {
            Entrenador entrenador = new Entrenador();
            entrenador.setUsuario(usuario);
            entrenador.setEspecialidad(especialidad.trim());
            entrenador.setFechaIngreso(LocalDate.now());
            return entrenadorRepository.save(entrenador).getId();
        }
        return null;
    }

    /** Respuesta del usuario incluyendo el id de su perfil (socio o entrenador). */
    public UsuarioResponseDTO toResponse(Usuario u) {
        return UsuarioMapper.toResponse(u, perfilId(u), esAdminPrincipal(u));
    }

    // ---------------------------------------------------------------- privados

    /** Id del perfil (socio o entrenador); null para ADMIN y RECEPCIONISTA. */
    private Long perfilId(Usuario u) {
        return switch (u.getRol()) {
            case SOCIO -> socioRepository.findByUsuarioId(u.getId()).map(s -> s.getId()).orElse(null);
            case ENTRENADOR -> entrenadorRepository.findByUsuarioId(u.getId()).map(e -> e.getId()).orElse(null);
            default -> null;
        };
    }

    /** Compara el código que escribió la persona con el que se envió a su correo. */
    public void validarCodigo(Usuario usuario, String codigo) {
        if (usuario.getIntentosVerificacion() >= maxIntentos) {
            throw new BusinessException("Se agotaron los " + maxIntentos + " intentos. Solicite un código nuevo");
        }
        if (usuario.getCodigoExpiracion() == null || usuario.getCodigoExpiracion().isBefore(LocalDateTime.now())) {
            throw new BusinessException("El código expiró: era válido por " + minutosExpiracion
                    + " minutos. Solicite un código nuevo");
        }
        if (!codigo.equals(usuario.getCodigoVerificacion())) {
            usuario.setIntentosVerificacion(usuario.getIntentosVerificacion() + 1);
            usuarioRepository.save(usuario);
            int restantes = maxIntentos - usuario.getIntentosVerificacion();
            String detalle = restantes > 0
                    ? "Quedan " + restantes + " de " + maxIntentos + " intentos"
                    : "Ya no quedan intentos: solicite un código nuevo";
            throw new BusinessException("El código no es correcto. Use el del último correo recibido. " + detalle);
        }
    }

    private void validarDatosUnicos(String cedula, String email, String celular) {
        usuarioRepository.findByCedula(cedula).ifPresent(u -> {
            throw new DuplicateResourceException("La cédula " + cedula + " ya está registrada como " + u.getRol()
                    + ". Una persona solo puede tener una cuenta y un rol en el gimnasio");
        });
        usuarioRepository.findByEmail(email).ifPresent(u -> {
            throw new DuplicateResourceException("El email " + email + " ya está registrado por otra persona (rol " + u.getRol() + ")");
        });
        usuarioRepository.findByCelular(celular).ifPresent(u -> {
            throw new DuplicateResourceException("El celular " + celular + " ya está registrado por otra persona (rol " + u.getRol() + ")");
        });
    }

    private Usuario obtener(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", id));
    }
}
