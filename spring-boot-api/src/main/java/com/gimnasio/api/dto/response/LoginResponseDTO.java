package com.gimnasio.api.dto.response;

public record LoginResponseDTO(
        String token,
        String tipo,
        long expiraEnSegundos,
        UsuarioResponseDTO usuario
) {
}
