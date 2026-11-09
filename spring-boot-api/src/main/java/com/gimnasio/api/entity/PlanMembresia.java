package com.gimnasio.api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

/** Solo existen 3 planes (QUINCENAL, MENSUAL, ANUAL); se crean al iniciar la aplicación. */
@Entity
@Table(name = "planes_membresia")
@Getter
@Setter
@NoArgsConstructor
public class PlanMembresia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true, length = 15)
    private TipoPlan tipo;

    @Column(nullable = false, length = 30)
    private String nombre;

    @Column(length = 255)
    private String descripcion;

    @Column(nullable = false, precision = 7, scale = 2)
    private BigDecimal precio;

    @Column(nullable = false)
    private Integer duracionDias;
}
