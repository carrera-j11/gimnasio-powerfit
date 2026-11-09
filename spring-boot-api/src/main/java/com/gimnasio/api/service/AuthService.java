package com.gimnasio.api.service;

import com.gimnasio.api.dto.request.EmailRequestDTO;
import com.gimnasio.api.dto.request.LoginRequestDTO;
import com.gimnasio.api.dto.request.RegistroRequestDTO;
import com.gimnasio.api.dto.request.VerificarCodigoDTO;
import com.gimnasio.api.dto.response.LoginResponseDTO;
import com.gimnasio.api.dto.response.MensajeResponseDTO;
import com.gimnasio.api.dto.response.RegistroResponseDTO;
import com.gimnasio.api.dto.response.UsuarioResponseDTO;
import com.gimnasio.api.entity.*;
import com.gimnasio.api.exception.*;
import com.gimnasio.api.repository.UsuarioRepository;
import com.gimnasio.api.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;
    private final UsuarioAdminService usuarioAdminService;

    @Value("${app.verificacion.minutos-expiracion}")
    private int minutosExpiracion;

    @Transactional
    public RegistroResponseDTO registrar(RegistroRequestDTO dto) {
        String email = normalizar(dto.email());
        validarRegistro(dto, email);

        Usuario usuario = new Usuario();
        usuario.setCedula(dto.cedula().trim());
        usuario.setNombres(dto.nombres().trim());
        usuario.setApellidos(dto.apellidos().trim());
        usuario.setEmail(email);
        usuario.setCelular(dto.celular().trim());
        usuario.setFechaNacimiento(dto.fechaNacimiento());
        usuario.setPassword(passwordEncoder.encode(dto.password()));
        usuario.setRol(dto.rolSolicitado());
        usuario.setEstado(EstadoCuenta.PENDIENTE_VERIFICACION);
        String codigo = asignarNuevoCodigo(usuario);
        usuarioRepository.save(usuario);

        Long perfilId = usuarioAdminService.crearPerfil(usuario, dto.especialidad(), dto.objetivo());

        emailService.enviarCodigoVerificacion(usuario, codigo, minutosExpiracion);

        return new RegistroResponseDTO(
                "Registro exitoso. Enviamos un código de 6 dígitos a " + email
                        + ". Ingréselo para verificar su correo (vence en " + minutosExpiracion + " minutos)",
                usuario.getId(), perfilId, email, usuario.getRol().name(), usuario.getEstado().name());
    }

    /**
     * La propia persona confirma su correo. La cuenta queda esperando la aprobación del ADMIN.
     * noRollbackFor para que SÍ se guarden los intentos fallidos.
     */
    @Transactional(noRollbackFor = BusinessException.class)
    public MensajeResponseDTO verificarCodigo(VerificarCodigoDTO dto) {
        Usuario usuario = buscarPorEmail(dto.email());
        if (usuario.getEstado() != EstadoCuenta.PENDIENTE_VERIFICACION) {
            throw new BusinessException("El correo " + usuario.getEmail() + " ya fue verificado");
        }
        usuarioAdminService.validarCodigo(usuario, dto.codigo().trim());
        usuario.setCodigoVerificacion(null);
        usuario.setCodigoExpiracion(null);
        usuario.setIntentosVerificacion(0);
        usuario.setFechaVerificacion(LocalDateTime.now());
        usuario.setEstado(EstadoCuenta.PENDIENTE_APROBACION);
        usuarioRepository.save(usuario);
        return new MensajeResponseDTO("Correo verificado. Su cuenta queda pendiente de aprobación por un administrador; "
                + "le avisaremos por correo cuando sea revisada");
    }

    @Transactional
    public MensajeResponseDTO reenviarCodigo(EmailRequestDTO dto) {
        Usuario usuario = buscarPorEmail(dto.email());
        if (usuario.getEstado() != EstadoCuenta.PENDIENTE_VERIFICACION) {
            throw new BusinessException("El correo " + usuario.getEmail() + " ya fue verificado, no necesita un código nuevo");
        }
        String codigo = asignarNuevoCodigo(usuario);
        usuarioRepository.save(usuario);
        emailService.enviarCodigoVerificacion(usuario, codigo, minutosExpiracion);
        return new MensajeResponseDTO("Se envió un nuevo código a " + usuario.getEmail());
    }

    @Transactional(readOnly = true)
    public LoginResponseDTO login(LoginRequestDTO dto) {
        Usuario usuario = usuarioRepository.findByEmail(normalizar(dto.email()))
                .orElseThrow(() -> new CredencialesInvalidasException("Email o contraseña incorrectos"));
        if (!passwordEncoder.matches(dto.password(), usuario.getPassword())) {
            throw new CredencialesInvalidasException("Email o contraseña incorrectos");
        }

        switch (usuario.getEstado()) {
            case PENDIENTE_VERIFICACION -> throw new CuentaNoHabilitadaException(
                    "Su cuenta está pendiente: primero verifique su correo con el código enviado a " + usuario.getEmail());
            case PENDIENTE_APROBACION -> throw new CuentaNoHabilitadaException(
                    "Su cuenta está pendiente de aprobación por un administrador");
            case RECHAZADA -> throw new CuentaNoHabilitadaException(
                    "Su cuenta fue rechazada. Motivo: " + usuario.getMotivoRechazo());
            case APROBADA -> { /* puede continuar */ }
        }

        String token = jwtService.generarToken(usuario);
        return new LoginResponseDTO(token, "Bearer", jwtService.getExpiracionSegundos(),
                usuarioAdminService.toResponse(usuario));
    }

    @Transactional(readOnly = true)
    public UsuarioResponseDTO perfil(Usuario usuario) {
        return usuarioAdminService.toResponse(usuario);
    }


    private void validarRegistro(RegistroRequestDTO dto, String email) {
        if (!dto.password().equals(dto.confirmarPassword())) {
            throw new BusinessException("La contraseña y la confirmación no coinciden: escriba exactamente la misma contraseña en ambos campos");
        }
        usuarioAdminService.validarNuevaCuenta(dto.cedula(), email, dto.celular(), dto.rolSolicitado(),
                dto.fechaNacimiento(), dto.especialidad());
    }

    private String asignarNuevoCodigo(Usuario usuario) {
        return usuarioAdminService.asignarNuevoCodigo(usuario);
    }

    private Usuario buscarPorEmail(String email) {
        return usuarioRepository.findByEmail(normalizar(email))
                .orElseThrow(() -> new ResourceNotFoundException("No existe una cuenta registrada con el email " + email
                        + ". Verifique que lo escribió igual que en el registro"));
    }

    private String normalizar(String email) {
        return email.trim().toLowerCase();
    }
}
