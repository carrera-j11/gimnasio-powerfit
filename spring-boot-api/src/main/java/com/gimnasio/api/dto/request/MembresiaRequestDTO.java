package com.gimnasio.api.dto.request;

import com.gimnasio.api.entity.TipoPlan;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDate;

public record MembresiaRequestDTO(

        @NotNull(message = "El id del socio es obligatorio")
        @Positive(message = "El id del socio debe ser positivo")
        Long socioId,

        @NotNull(message = "El plan es obligatorio (QUINCENAL, MENSUAL o ANUAL)")
        TipoPlan tipoPlan,

        // Opcional: si no se envía, se usa la fecha de hoy
        LocalDate fechaInicio
) {
}
