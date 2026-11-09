package com.gimnasio.api.repository;

import com.gimnasio.api.entity.Clase;
import com.gimnasio.api.entity.DiaSemana;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClaseRepository extends JpaRepository<Clase, Long> {

    List<Clase> findByEntrenadorId(Long entrenadorId);

    List<Clase> findByEntrenadorIdAndDiaSemana(Long entrenadorId, DiaSemana diaSemana);

    boolean existsByEntrenadorId(Long entrenadorId);
}
