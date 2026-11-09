package com.gimnasio.api.dto.response;

import java.math.BigDecimal;

public record PlanResponseDTO(
        Long id,
        String tipo,
        String nombre,
        String descripcion,
        BigDecimal precio,
        Integer duracionDias
) {
}
