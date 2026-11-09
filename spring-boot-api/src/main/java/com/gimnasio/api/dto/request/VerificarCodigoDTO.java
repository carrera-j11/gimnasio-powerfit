package com.gimnasio.api.dto.request;

import com.gimnasio.api.validation.CodigoVerificacion;
import jakarta.validation.constraints.NotBlank;

/** La propia persona confirma su correo con el código de 6 dígitos que recibió. */
public record VerificarCodigoDTO(

        @NotBlank(message = "El email es obligatorio")
        String email,

        @NotBlank(message = "El código de verificación es obligatorio")
        @CodigoVerificacion
        String codigo
) {
}
