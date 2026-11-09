package com.gimnasio.api.repository;

import com.gimnasio.api.entity.Pago;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface PagoRepository extends JpaRepository<Pago, Long> {

    List<Pago> findAllByOrderByIdDesc();

    List<Pago> findByMembresiaIdOrderByIdDesc(Long membresiaId);

    List<Pago> findByMembresiaSocioIdOrderByIdDesc(Long socioId);

    boolean existsByMembresiaId(Long membresiaId);

    // JPQL: suma lo pagado de una membresía (0 si no hay pagos)
    @Query("SELECT COALESCE(SUM(p.monto), 0) FROM Pago p WHERE p.membresia.id = :membresiaId")
    BigDecimal totalPagado(@Param("membresiaId") Long membresiaId);
}
