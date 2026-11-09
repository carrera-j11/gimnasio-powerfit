package com.gimnasio.api.dto.request;

import com.gimnasio.api.entity.MetodoPago;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record PagoRequestDTO(

        @NotNull(message = "El id de la membresía es obligatorio")
        @Positive(message = "El id de la membresía debe ser positivo")
        Long membresiaId,

        @NotNull(message = "El monto es obligatorio")
        @DecimalMin(value = "0.01", message = "El monto debe ser mayor a 0")
        @Digits(integer = 4, fraction = 2, message = "El monto puede tener máximo 2 decimales")
        BigDecimal monto,

        @NotNull(message = "El método de pago es obligatorio (EFECTIVO, TARJETA o TRANSFERENCIA)")
        MetodoPago metodoPago,

        // Obligatoria solo para TRANSFERENCIA (se valida en el service)
        @Size(max = 50, message = "La referencia no puede superar los 50 caracteres")
        String referencia
) {
}
