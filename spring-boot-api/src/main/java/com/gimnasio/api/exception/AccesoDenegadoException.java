package com.gimnasio.api.exception;

/** El usuario tiene sesión pero intenta ver o modificar datos que no le pertenecen (HTTP 403). */
public class AccesoDenegadoException extends RuntimeException {

    public AccesoDenegadoException(String mensaje) {
        super(mensaje);
    }
}
