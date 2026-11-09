package com.gimnasio.api.dto.request;

import com.gimnasio.api.entity.TipoPlan;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

/** Al actualizar no se cambia el socio (una membresía no cambia de dueño). */
public record MembresiaUpdateDTO(

        @NotNull(message = "El plan es obligatorio (QUINCENAL, MENSUAL o ANUAL)")
        TipoPlan tipoPlan,

        LocalDate fechaInicio
) {
}
