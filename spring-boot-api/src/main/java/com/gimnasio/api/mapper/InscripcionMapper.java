package com.gimnasio.api.mapper;

import com.gimnasio.api.dto.response.InscripcionResponseDTO;
import com.gimnasio.api.entity.Clase;
import com.gimnasio.api.entity.Inscripcion;

public final class InscripcionMapper {

    private InscripcionMapper() {
    }

    public static InscripcionResponseDTO toResponse(Inscripcion i) {
        Clase c = i.getClase();
        return new InscripcionResponseDTO(
                i.getId(), i.getSocio().getId(), i.getSocio().getUsuario().getNombreCompleto(),
                i.getSocio().getUsuario().getCedula(), c.getId(), c.getNombre(),
                c.getEntrenador().getUsuario().getNombreCompleto(),
                c.getDiaSemana() + " " + c.getHoraInicio() + " - " + c.getHoraFin(),
                i.getFechaInscripcion());
    }
}
