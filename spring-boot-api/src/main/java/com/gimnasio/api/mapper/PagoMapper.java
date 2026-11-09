package com.gimnasio.api.mapper;

import com.gimnasio.api.dto.response.PagoResponseDTO;
import com.gimnasio.api.entity.Pago;

public final class PagoMapper {

    private PagoMapper() {
    }

    public static PagoResponseDTO toResponse(Pago p) {
        return new PagoResponseDTO(
                p.getId(), p.getMembresia().getId(), p.getMembresia().getSocio().getId(),
                p.getMembresia().getSocio().getUsuario().getNombreCompleto(),
                p.getMembresia().getPlan().getNombre(), p.getMonto(), p.getMetodoPago().name(),
                p.getReferencia(), p.getFechaPago());
    }
}
