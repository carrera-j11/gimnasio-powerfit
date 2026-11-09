package com.gimnasio.api.mapper;

import com.gimnasio.api.dto.response.MembresiaResponseDTO;
import com.gimnasio.api.entity.Membresia;

import java.math.BigDecimal;

public final class MembresiaMapper {

    private MembresiaMapper() {
    }

    public static MembresiaResponseDTO toResponse(Membresia m, BigDecimal totalPagado) {
        BigDecimal precio = m.getPlan().getPrecio();
        return new MembresiaResponseDTO(
                m.getId(), m.getSocio().getId(), m.getSocio().getUsuario().getNombreCompleto(),
                m.getSocio().getUsuario().getCedula(), m.getPlan().getTipo().name(), m.getPlan().getNombre(),
                precio, m.getFechaInicio(), m.getFechaFin(), m.getEstado().name(),
                totalPagado, precio.subtract(totalPagado));
    }
}
