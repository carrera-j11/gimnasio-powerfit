package com.gimnasio.api.repository;

import com.gimnasio.api.entity.DiaSemana;
import com.gimnasio.api.entity.Inscripcion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InscripcionRepository extends JpaRepository<Inscripcion, Long> {

    List<Inscripcion> findAllByOrderByIdDesc();

    List<Inscripcion> findBySocioId(Long socioId);

    List<Inscripcion> findByClaseId(Long claseId);

    // Clases del socio en un día (para evitar que se cruce de horario)
    List<Inscripcion> findBySocioIdAndClaseDiaSemana(Long socioId, DiaSemana diaSemana);

    long countByClaseId(Long claseId);

    boolean existsBySocioIdAndClaseId(Long socioId, Long claseId);

    boolean existsBySocioId(Long socioId);

    boolean existsByClaseId(Long claseId);
}
