package com.gimnasio.api.service;

import com.gimnasio.api.dto.request.EntrenadorUpdateDTO;
import com.gimnasio.api.dto.response.EntrenadorResponseDTO;
import com.gimnasio.api.entity.Entrenador;
import com.gimnasio.api.entity.EstadoCuenta;
import com.gimnasio.api.entity.Rol;
import com.gimnasio.api.entity.Usuario;
import com.gimnasio.api.exception.AccesoDenegadoException;
import com.gimnasio.api.exception.BusinessException;
import com.gimnasio.api.exception.ResourceNotFoundException;
import com.gimnasio.api.mapper.EntrenadorMapper;
import com.gimnasio.api.repository.ClaseRepository;
import com.gimnasio.api.repository.EntrenadorRepository;
import com.gimnasio.api.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Los entrenadores se crean al registrarse y un ADMIN los aprueba. */
@Service
@RequiredArgsConstructor
public class EntrenadorService {

    private final EntrenadorRepository entrenadorRepository;
    private final UsuarioRepository usuarioRepository;
    private final UsuarioAdminService usuarioAdminService;
    private final ClaseRepository claseRepository;

    @Transactional(readOnly = true)
    public List<EntrenadorResponseDTO> listar() {
        return entrenadorRepository.findByUsuarioEstadoOrderByIdAsc(EstadoCuenta.APROBADA).stream()
                .map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public EntrenadorResponseDTO buscarPorId(Long id) {
        return toResponse(obtenerEntidad(id));
    }

    @Transactional(readOnly = true)
    public EntrenadorResponseDTO miPerfil(Usuario actual) {
        return toResponse(obtenerPorUsuario(actual));
    }

    /** ADMIN edita cualquiera; un ENTRENADOR solo sus propios datos. */
    @Transactional
    public EntrenadorResponseDTO actualizar(Long id, EntrenadorUpdateDTO dto, Usuario actual) {
        Entrenador entrenador = obtenerEntidad(id);
        if (actual.getRol() == Rol.ENTRENADOR && !entrenador.getUsuario().getId().equals(actual.getId())) {
            throw new AccesoDenegadoException("Un entrenador solo puede editar sus propios datos");
        }
        Usuario u = entrenador.getUsuario();
        usuarioAdminService.validarCelularDisponible(dto.celular(), u.getId());
        u.setNombres(dto.nombres().trim());
        u.setApellidos(dto.apellidos().trim());
        u.setCelular(dto.celular().trim());
        entrenador.setEspecialidad(dto.especialidad().trim());
        usuarioRepository.save(u);
        return toResponse(entrenadorRepository.save(entrenador));
    }

    @Transactional
    public void eliminar(Long id) {
        Entrenador entrenador = obtenerEntidad(id);
        if (claseRepository.existsByEntrenadorId(id)) {
            throw new BusinessException("No se puede eliminar el entrenador porque tiene clases creadas");
        }
        Usuario usuario = entrenador.getUsuario();
        entrenadorRepository.delete(entrenador);
        usuarioRepository.delete(usuario);
    }

    // ---------------------------------------------------------------- uso interno

    public Entrenador obtenerEntidad(Long id) {
        return entrenadorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Entrenador", id));
    }

    public Entrenador obtenerPorUsuario(Usuario usuario) {
        return entrenadorRepository.findByUsuarioId(usuario.getId())
                .orElseThrow(() -> new ResourceNotFoundException("El usuario actual no tiene un perfil de entrenador"));
    }

    private EntrenadorResponseDTO toResponse(Entrenador e) {
        return EntrenadorMapper.toResponse(e, claseRepository.findByEntrenadorId(e.getId()).size());
    }
}
