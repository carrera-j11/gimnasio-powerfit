package com.gimnasio.api.mapper;

import com.gimnasio.api.dto.response.EntrenadorResponseDTO;
import com.gimnasio.api.entity.Entrenador;
import com.gimnasio.api.entity.Usuario;

public final class EntrenadorMapper {

    private EntrenadorMapper() {
    }

    public static EntrenadorResponseDTO toResponse(Entrenador e, long totalClases) {
        Usuario u = e.getUsuario();
        return new EntrenadorResponseDTO(
                e.getId(), u.getId(), u.getNombres(), u.getApellidos(), u.getEmail(), u.getCelular(),
                e.getEspecialidad(), e.getFechaIngreso(), u.getEstado().name(), totalClases);
    }
}
