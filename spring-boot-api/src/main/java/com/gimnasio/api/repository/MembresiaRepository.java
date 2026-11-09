package com.gimnasio.api.repository;

import com.gimnasio.api.entity.EstadoMembresia;
import com.gimnasio.api.entity.Membresia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface MembresiaRepository extends JpaRepository<Membresia, Long> {

    List<Membresia> findAllByOrderByIdDesc();

    List<Membresia> findBySocioIdOrderByIdDesc(Long socioId);

    boolean existsBySocioId(Long socioId);

    // ¿Tiene una membresía ACTIVA que siga vigente en cierta fecha?
    boolean existsBySocioIdAndEstadoAndFechaFinGreaterThanEqual(Long socioId, EstadoMembresia estado, LocalDate fecha);

    // ¿Tiene una membresía ACTIVA vigente HOY? (ya empezó y no ha terminado)
    boolean existsBySocioIdAndEstadoAndFechaInicioLessThanEqualAndFechaFinGreaterThanEqual(
            Long socioId, EstadoMembresia estado, LocalDate hoy1, LocalDate hoy2);
}
