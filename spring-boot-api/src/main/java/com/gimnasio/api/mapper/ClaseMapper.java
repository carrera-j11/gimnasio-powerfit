package com.gimnasio.api.mapper;

import com.gimnasio.api.dto.response.ClaseResponseDTO;
import com.gimnasio.api.entity.Clase;

public final class ClaseMapper {

    private ClaseMapper() {
    }

    public static ClaseResponseDTO toResponse(Clase c, long inscritos) {
        return new ClaseResponseDTO(
                c.getId(), c.getNombre(), c.getDescripcion(), c.getDiaSemana().name(),
                c.getHoraInicio(), c.getHoraFin(),
                c.getDiaSemana() + " " + c.getHoraInicio() + " - " + c.getHoraFin(),
                c.getCupoMaximo(), inscritos, c.getCupoMaximo() - inscritos,
                c.getEntrenador().getId(), c.getEntrenador().getUsuario().getNombreCompleto(),
                c.getEntrenador().getEspecialidad(), c.getEntrenador().getUsuario().getEmail(),
                c.getEntrenador().getUsuario().getCelular());
    }
}
