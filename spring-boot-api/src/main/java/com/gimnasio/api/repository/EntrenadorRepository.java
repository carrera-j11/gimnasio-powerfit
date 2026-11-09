package com.gimnasio.api.repository;

import com.gimnasio.api.entity.Entrenador;
import com.gimnasio.api.entity.EstadoCuenta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EntrenadorRepository extends JpaRepository<Entrenador, Long> {

    Optional<Entrenador> findByUsuarioId(Long usuarioId);

    List<Entrenador> findByUsuarioEstadoOrderByIdAsc(EstadoCuenta estado);
}
