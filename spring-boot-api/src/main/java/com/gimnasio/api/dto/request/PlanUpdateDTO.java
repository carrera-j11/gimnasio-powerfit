package com.gimnasio.api.dto.request;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

/** El tipo y la duración del plan son fijos; solo se cambian el precio y la descripción. */
public record PlanUpdateDTO(

        @Size(max = 255, message = "La descripción no puede superar los 255 caracteres")
        String descripcion,

        @NotNull(message = "El precio es obligatorio")
        @DecimalMin(value = "1.00", message = "El precio debe ser al menos 1.00")
        @DecimalMax(value = "1000.00", message = "El precio no puede superar 1000.00")
        @Digits(integer = 4, fraction = 2, message = "El precio puede tener máximo 2 decimales")
        BigDecimal precio
) {
}
