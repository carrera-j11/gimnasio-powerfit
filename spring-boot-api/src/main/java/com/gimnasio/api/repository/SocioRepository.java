package com.gimnasio.api.repository;

import com.gimnasio.api.entity.EstadoCuenta;
import com.gimnasio.api.entity.Socio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SocioRepository extends JpaRepository<Socio, Long> {

    Optional<Socio> findByUsuarioId(Long usuarioId);

    Optional<Socio> findByUsuarioCedula(String cedula);

    List<Socio> findByUsuarioEstadoOrderByIdAsc(EstadoCuenta estado);
}
