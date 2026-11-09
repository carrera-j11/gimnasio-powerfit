package com.gimnasio.api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

/** Perfil de entrenador. Usuario 1 --- 1 Entrenador; Entrenador 1 --- N Clase */
@Entity
@Table(name = "entrenadores")
@Getter
@Setter
@NoArgsConstructor
public class Entrenador {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false)
    @JoinColumn(name = "usuario_id", nullable = false, unique = true)
    private Usuario usuario;

    @Column(nullable = false, length = 60)
    private String especialidad;

    @Column(nullable = false)
    private LocalDate fechaIngreso;
}
