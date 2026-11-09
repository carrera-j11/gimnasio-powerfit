package com.gimnasio.api.entity;

/** El gimnasio maneja SOLO estos tres planes, con su duración fija. */
public enum TipoPlan {
    QUINCENAL("Plan Quincenal", 15),
    MENSUAL("Plan Mensual", 30),
    ANUAL("Plan Anual", 365);

    private final String nombre;
    private final int dias;

    TipoPlan(String nombre, int dias) {
        this.nombre = nombre;
        this.dias = dias;
    }

    public String getNombre() {
        return nombre;
    }

    public int getDias() {
        return dias;
    }
}
