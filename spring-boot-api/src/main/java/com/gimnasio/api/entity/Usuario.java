package com.gimnasio.api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Cuenta de acceso al sistema con los datos personales de la persona.
 * Según el rol, se relaciona 1:1 con un perfil de Socio o de Entrenador.
 */
@Entity
@Table(name = "usuarios")
@Getter
@Setter
@NoArgsConstructor
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 10)
    private String cedula;

    @Column(nullable = false, length = 50)
    private String nombres;

    @Column(nullable = false, length = 50)
    private String apellidos;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    // Cédula, email y celular son únicos: una persona = una sola cuenta = un solo rol
    @Column(nullable = false, unique = true, length = 10)
    private String celular;

    @Column(nullable = false)
    private LocalDate fechaNacimiento;

    // Cifrada con BCrypt, nunca en texto plano
    @Column(nullable = false, length = 100)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Rol rol;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 25)
    private EstadoCuenta estado;

    @Column(length = 6)
    private String codigoVerificacion;

    private LocalDateTime codigoExpiracion;

    @Column(nullable = false)
    private int intentosVerificacion;

    @Column(length = 255)
    private String motivoRechazo;

    @Column(nullable = false, updatable = false)
    private LocalDateTime fechaRegistro;

    private LocalDateTime fechaVerificacion;

    private LocalDateTime fechaAprobacion;

    @PrePersist
    public void prePersist() {
        this.fechaRegistro = LocalDateTime.now();
    }

    public String getNombreCompleto() {
        return nombres + " " + apellidos;
    }
}
