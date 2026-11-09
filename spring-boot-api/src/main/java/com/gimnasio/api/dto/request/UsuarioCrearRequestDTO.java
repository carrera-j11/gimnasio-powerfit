package com.gimnasio.api.dto.request;

import com.gimnasio.api.entity.Rol;
import com.gimnasio.api.validation.Cedula;
import com.gimnasio.api.validation.Celular;
import com.gimnasio.api.validation.PasswordSegura;
import jakarta.validation.constraints.*;

import java.time.LocalDate;

/**
 * El ADMIN agrega directamente un SOCIO (cliente), ENTRENADOR, RECEPCIONISTA o ADMIN.
 * La cuenta queda PENDIENTE_APROBACION hasta que el ADMIN la revise (decision 1 o 2).
 */
public record UsuarioCrearRequestDTO(

        @NotBlank(message = "La cédula es obligatoria")
        @Cedula
        String cedula,

        @NotBlank(message = "Los nombres son obligatorios")
        @Size(min = 2, max = 50, message = "Los nombres deben tener entre 2 y 50 caracteres")
        @Pattern(regexp = "^[A-Za-zÁÉÍÓÚáéíóúÑñÜü ]+$", message = "Los nombres solo pueden contener letras y espacios (sin números ni símbolos)")
        String nombres,

        @NotBlank(message = "Los apellidos son obligatorios")
        @Size(min = 2, max = 50, message = "Los apellidos deben tener entre 2 y 50 caracteres")
        @Pattern(regexp = "^[A-Za-zÁÉÍÓÚáéíóúÑñÜü ]+$", message = "Los apellidos solo pueden contener letras y espacios (sin números ni símbolos)")
        String apellidos,

        @NotBlank(message = "El email es obligatorio")
        @Email(regexp = "^[^\\s@]+@[^\\s@]+\\.[A-Za-z]{2,}$", message = "El email no tiene un formato válido (ejemplo: nombre@gmail.com)")
        @Size(max = 100, message = "El email no puede superar los 100 caracteres")
        String email,

        @NotBlank(message = "El celular es obligatorio")
        @Celular
        String celular,

        @NotNull(message = "La fecha de nacimiento es obligatoria")
        @Past(message = "La fecha de nacimiento debe ser una fecha pasada")
        LocalDate fechaNacimiento,

        @NotBlank(message = "La contraseña es obligatoria")
        @PasswordSegura
        String password,

        @NotNull(message = "El rol es obligatorio (SOCIO, ENTRENADOR, RECEPCIONISTA o ADMIN)")
        Rol rol,

        // Obligatoria solo para ENTRENADOR (se valida en el service)
        @Size(max = 60, message = "La especialidad no puede superar los 60 caracteres")
        String especialidad,

        // Opcional para socios
        @Size(max = 150, message = "El objetivo no puede superar los 150 caracteres")
        String objetivo
) {
}
