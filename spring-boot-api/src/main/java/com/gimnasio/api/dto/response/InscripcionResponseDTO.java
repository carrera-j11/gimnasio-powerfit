package com.gimnasio.api.dto.response;

import java.time.LocalDateTime;

public record InscripcionResponseDTO(
        Long id,
        Long socioId,
        String socioNombre,
        String socioCedula,
        Long claseId,
        String claseNombre,
        String entrenadorNombre,
        String horario,
        LocalDateTime fechaInscripcion
) {
}
