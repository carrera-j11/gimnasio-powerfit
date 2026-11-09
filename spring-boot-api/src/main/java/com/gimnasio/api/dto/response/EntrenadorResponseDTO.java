package com.gimnasio.api.dto.response;

import java.time.LocalDate;

public record EntrenadorResponseDTO(
        Long id,
        Long usuarioId,
        String nombres,
        String apellidos,
        String email,
        String celular,
        String especialidad,
        LocalDate fechaIngreso,
        String estadoCuenta,
        long totalClases
) {
}
