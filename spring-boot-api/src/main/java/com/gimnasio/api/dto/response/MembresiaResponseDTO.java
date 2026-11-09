package com.gimnasio.api.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

public record MembresiaResponseDTO(
        Long id,
        Long socioId,
        String socioNombre,
        String socioCedula,
        String tipoPlan,
        String planNombre,
        BigDecimal precioPlan,
        LocalDate fechaInicio,
        LocalDate fechaFin,
        String estado,
        BigDecimal totalPagado,
        BigDecimal saldoPendiente
) {
}
