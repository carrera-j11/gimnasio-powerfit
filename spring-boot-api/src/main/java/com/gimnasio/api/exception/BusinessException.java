package com.gimnasio.api.exception;

/** Se lanza cuando se incumple una regla del negocio, ej. clase llena (HTTP 400). */
public class BusinessException extends RuntimeException {

    public BusinessException(String mensaje) {
        super(mensaje);
    }
}
