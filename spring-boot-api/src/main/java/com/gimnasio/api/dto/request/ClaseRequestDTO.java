package com.gimnasio.api.dto.request;

import com.gimnasio.api.entity.DiaSemana;
import jakarta.validation.constraints.*;

import java.time.LocalTime;

/**
 * Cada clase tiene SIEMPRE un único entrenador encargado:
 * - ADMIN: debe enviar entrenadorId.
 * - ENTRENADOR: no lo envía; la clase queda a su nombre.
 */
public record ClaseRequestDTO(

        @NotBlank(message = "El nombre de la clase es obligatorio")
        @Size(min = 3, max = 50, message = "El nombre debe tener entre 3 y 50 caracteres")
        String nombre,

        @Size(max = 255, message = "La descripción no puede superar los 255 caracteres")
        String descripcion,

        @NotNull(message = "El día de la semana es obligatorio (LUNES ... DOMINGO)")
        DiaSemana diaSemana,

        @NotNull(message = "La hora de inicio es obligatoria")
        LocalTime horaInicio,

        @NotNull(message = "La hora de fin es obligatoria")
        LocalTime horaFin,

        @NotNull(message = "El número máximo de participantes es obligatorio")
        @Min(value = 1, message = "La clase debe permitir al menos 1 participante")
        @Max(value = 30, message = "La clase no puede tener más de 30 participantes")
        Integer cupoMaximo,

        @Positive(message = "El id del entrenador debe ser positivo")
        Long entrenadorId
) {
}
