package com.gimnasio.api.exception;

/** Se lanza cuando se intenta registrar un dato que ya existe, ej. cédula repetida (HTTP 409). */
public class DuplicateResourceException extends RuntimeException {

    public DuplicateResourceException(String mensaje) {
        super(mensaje);
    }
}
