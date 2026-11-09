package com.gimnasio.api.dto.response;

import java.time.LocalDate;

public record SocioResponseDTO(
        Long id,
        Long usuarioId,
        String cedula,
        String nombres,
        String apellidos,
        String email,
        String celular,
        LocalDate fechaNacimiento,
        int edad,
        String objetivo,
        LocalDate fechaAfiliacion,
        String estadoCuenta,
        boolean membresiaVigente
) {
}
