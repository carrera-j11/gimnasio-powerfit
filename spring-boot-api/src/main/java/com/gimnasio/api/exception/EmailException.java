package com.gimnasio.api.exception;

/** No se pudo enviar un correo (HTTP 503). */
public class EmailException extends RuntimeException {

    public EmailException(String mensaje) {
        super(mensaje);
    }
}
