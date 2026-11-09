package com.gimnasio.api.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Revisión del ADMIN sobre una cuenta que ya verificó su correo.
 * La decisión es 1 = aprobar o 2 = rechazar.
 */
public record RevisionUsuarioDTO(

        @NotNull(message = "La decisión es obligatoria: 1 = aprobar, 2 = rechazar")
        @Min(value = 1, message = "La decisión solo puede ser 1 (aprobar) o 2 (rechazar)")
        @Max(value = 2, message = "La decisión solo puede ser 1 (aprobar) o 2 (rechazar)")
        Integer decision,

        // Opcional: motivo del rechazo (decision = 2)
        @Size(max = 255, message = "El motivo no puede superar los 255 caracteres")
        String motivo
) {
}
