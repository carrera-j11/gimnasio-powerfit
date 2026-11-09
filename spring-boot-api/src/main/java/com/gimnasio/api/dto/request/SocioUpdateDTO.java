package com.gimnasio.api.dto.request;

import com.gimnasio.api.validation.Celular;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Datos que se pueden editar de un socio (la cédula y el email no se cambian). */
public record SocioUpdateDTO(

        @NotBlank(message = "Los nombres son obligatorios")
        @Size(min = 2, max = 50, message = "Los nombres deben tener entre 2 y 50 caracteres")
        @Pattern(regexp = "^[A-Za-zÁÉÍÓÚáéíóúÑñÜü ]+$", message = "Los nombres solo pueden contener letras y espacios (sin números ni símbolos)")
        String nombres,

        @NotBlank(message = "Los apellidos son obligatorios")
        @Size(min = 2, max = 50, message = "Los apellidos deben tener entre 2 y 50 caracteres")
        @Pattern(regexp = "^[A-Za-zÁÉÍÓÚáéíóúÑñÜü ]+$", message = "Los apellidos solo pueden contener letras y espacios (sin números ni símbolos)")
        String apellidos,

        @NotBlank(message = "El celular es obligatorio")
        @Celular
        String celular,

        @Size(max = 150, message = "El objetivo no puede superar los 150 caracteres")
        String objetivo
) {
}
