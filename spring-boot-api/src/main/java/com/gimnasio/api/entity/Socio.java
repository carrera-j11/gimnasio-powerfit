package com.gimnasio.api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

/** Perfil de socio del gimnasio. Usuario 1 --- 1 Socio */
@Entity
@Table(name = "socios")
@Getter
@Setter
@NoArgsConstructor
public class Socio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false)
    @JoinColumn(name = "usuario_id", nullable = false, unique = true)
    private Usuario usuario;

    // Objetivo de entrenamiento (opcional): bajar de peso, ganar masa muscular...
    @Column(length = 150)
    private String objetivo;

    @Column(nullable = false)
    private LocalDate fechaAfiliacion;
}
