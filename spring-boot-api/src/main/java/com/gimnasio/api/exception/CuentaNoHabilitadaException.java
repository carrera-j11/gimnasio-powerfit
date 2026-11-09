package com.gimnasio.api.exception;

/** La cuenta existe pero aún no puede entrar: sin verificar, pendiente de aprobación o rechazada (HTTP 403). */
public class CuentaNoHabilitadaException extends RuntimeException {

    public CuentaNoHabilitadaException(String mensaje) {
        super(mensaje);
    }
}
