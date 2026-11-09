package com.gimnasio.api.mapper;

import com.gimnasio.api.dto.response.SocioResponseDTO;
import com.gimnasio.api.entity.Socio;
import com.gimnasio.api.entity.Usuario;

public final class SocioMapper {

    private SocioMapper() {
    }

    public static SocioResponseDTO toResponse(Socio s, boolean membresiaVigente) {
        Usuario u = s.getUsuario();
        return new SocioResponseDTO(
                s.getId(), u.getId(), u.getCedula(), u.getNombres(), u.getApellidos(), u.getEmail(),
                u.getCelular(), u.getFechaNacimiento(), UsuarioMapper.edad(u.getFechaNacimiento()),
                s.getObjetivo(), s.getFechaAfiliacion(), u.getEstado().name(), membresiaVigente);
    }
}
