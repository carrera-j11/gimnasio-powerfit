package com.gimnasio.api.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/**
 * Un SOCIO se inscribe a sí mismo (solo envía claseId).
 * ADMIN o RECEPCIONISTA inscriben a un socio enviando también socioId.
 */
public record InscripcionRequestDTO(

        @NotNull(message = "El id de la clase es obligatorio")
        @Positive(message = "El id de la clase debe ser positivo")
        Long claseId,

        @Positive(message = "El id del socio debe ser positivo")
        Long socioId
) {
}
