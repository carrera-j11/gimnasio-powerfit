package com.gimnasio.api.dto.response;

import java.time.LocalTime;

public record ClaseResponseDTO(
        Long id,
        String nombre,
        String descripcion,
        String diaSemana,
        LocalTime horaInicio,
        LocalTime horaFin,
        String horario,
        Integer cupoMaximo,
        long inscritos,
        long cuposDisponibles,
        Long entrenadorId,
        String entrenadorNombre,
        String especialidad,
        String entrenadorEmail,
        String entrenadorCelular
) {
}
