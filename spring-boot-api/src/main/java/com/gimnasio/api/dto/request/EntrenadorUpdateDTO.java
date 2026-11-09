package com.gimnasio.api.dto.request;

import com.gimnasio.api.validation.Celular;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record EntrenadorUpdateDTO(

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

        @NotBlank(message = "La especialidad es obligatoria")
        @Size(min = 3, max = 60, message = "La especialidad debe tener entre 3 y 60 caracteres")
        String especialidad
) {
}
