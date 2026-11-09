package com.gimnasio.api.repository;

import com.gimnasio.api.entity.PlanMembresia;
import com.gimnasio.api.entity.TipoPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlanMembresiaRepository extends JpaRepository<PlanMembresia, Long> {

    Optional<PlanMembresia> findByTipo(TipoPlan tipo);

    boolean existsByTipo(TipoPlan tipo);

    List<PlanMembresia> findAllByOrderByDuracionDiasAsc();
}
