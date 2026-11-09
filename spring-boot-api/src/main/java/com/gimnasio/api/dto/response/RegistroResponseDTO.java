package com.gimnasio.api.dto.response;

public record RegistroResponseDTO(
        String mensaje,
        Long usuarioId,
        Long perfilId,
        String email,
        String rolSolicitado,
        String estado
) {
}
