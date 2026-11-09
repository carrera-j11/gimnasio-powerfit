package com.gimnasio.api.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PagoResponseDTO(
        Long id,
        Long membresiaId,
        Long socioId,
        String socioNombre,
        String planNombre,
        BigDecimal monto,
        String metodoPago,
        String referencia,
        LocalDateTime fechaPago
) {
}
