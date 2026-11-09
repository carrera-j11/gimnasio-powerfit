package com.gimnasio.api.entity;

/**
 * Ciclo de vida de una cuenta:
 * PENDIENTE_VERIFICACION -> (código del correo) -> PENDIENTE_APROBACION
 * -> (el ADMIN la revisa) -> APROBADA o RECHAZADA.
 * Solo las cuentas APROBADAS pueden iniciar sesión.
 */
public enum EstadoCuenta {
    PENDIENTE_VERIFICACION,
    PENDIENTE_APROBACION,
    APROBADA,
    RECHAZADA
}
