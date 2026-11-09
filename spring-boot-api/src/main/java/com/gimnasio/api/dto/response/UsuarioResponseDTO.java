package com.gimnasio.api.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** Datos públicos de un usuario: NUNCA incluye la contraseña ni el código. */
public record UsuarioResponseDTO(
        Long id,
        String cedula,
        String nombres,
        String apellidos,
        String email,
        String celular,
        LocalDate fechaNacimiento,
        int edad,
        String rol,
        String estado,
        Long perfilId,
        String motivoRechazo,
        LocalDateTime fechaRegistro,
        LocalDateTime fechaVerificacion,
        LocalDateTime fechaAprobacion,
        // true solo para el administrador principal (app.admin.email): el único que aprueba nuevos ADMIN
        boolean adminPrincipal
) {
}
