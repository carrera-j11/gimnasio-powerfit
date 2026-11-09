package com.gimnasio.api.repository;

import com.gimnasio.api.entity.EstadoCuenta;
import com.gimnasio.api.entity.Rol;
import com.gimnasio.api.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByCedula(String cedula);

    Optional<Usuario> findByCedula(String cedula);

    Optional<Usuario> findByCelular(String celular);

    boolean existsByCelularAndIdNot(String celular, Long id);

    long countByRolAndEstadoNot(Rol rol, EstadoCuenta estado);

    List<Usuario> findByEstadoAndRolInOrderByIdAsc(EstadoCuenta estado, List<Rol> roles);

    List<Usuario> findByEstadoOrderByIdAsc(EstadoCuenta estado);

    List<Usuario> findByEstadoInOrderByIdAsc(List<EstadoCuenta> estados);

    List<Usuario> findByRolAndEstado(Rol rol, EstadoCuenta estado);
}
