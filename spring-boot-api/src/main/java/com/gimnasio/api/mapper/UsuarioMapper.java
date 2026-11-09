package com.gimnasio.api.mapper;

import com.gimnasio.api.dto.response.UsuarioResponseDTO;
import com.gimnasio.api.entity.Usuario;

import java.time.LocalDate;
import java.time.Period;

public final class UsuarioMapper {

    private UsuarioMapper() {
    }

    public static int edad(LocalDate fechaNacimiento) {
        return Period.between(fechaNacimiento, LocalDate.now()).getYears();
    }

    /** perfilId: id del Socio o del Entrenador vinculado (null para ADMIN y RECEPCIONISTA). */
    public static UsuarioResponseDTO toResponse(Usuario u, Long perfilId, boolean adminPrincipal) {
        return new UsuarioResponseDTO(
                u.getId(), u.getCedula(), u.getNombres(), u.getApellidos(), u.getEmail(), u.getCelular(),
                u.getFechaNacimiento(), edad(u.getFechaNacimiento()),
                u.getRol().name(), u.getEstado().name(), perfilId, u.getMotivoRechazo(),
                u.getFechaRegistro(), u.getFechaVerificacion(), u.getFechaAprobacion(), adminPrincipal);
    }
}
