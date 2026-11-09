package com.gimnasio.api.mapper;

import com.gimnasio.api.dto.response.PlanResponseDTO;
import com.gimnasio.api.entity.PlanMembresia;

public final class PlanMapper {

    private PlanMapper() {
    }

    public static PlanResponseDTO toResponse(PlanMembresia p) {
        return new PlanResponseDTO(p.getId(), p.getTipo().name(), p.getNombre(), p.getDescripcion(),
                p.getPrecio(), p.getDuracionDias());
    }
}
