package com.gimnasio.api.controller;

import com.gimnasio.api.dto.request.RevisionUsuarioDTO;
import com.gimnasio.api.dto.request.UsuarioCrearRequestDTO;
import com.gimnasio.api.dto.response.UsuarioResponseDTO;
import com.gimnasio.api.entity.EstadoCuenta;
import com.gimnasio.api.entity.Rol;
import com.gimnasio.api.entity.Usuario;
import com.gimnasio.api.service.UsuarioAdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Gestión de cuentas: SOLO ADMIN. */
@RestController
@RequestMapping("/api/admin/usuarios")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class UsuarioAdminController {

    private final UsuarioAdminService usuarioAdminService;

    /** Filtros opcionales: ?estado=PENDIENTE_APROBACION&rol=ENTRENADOR */
    @GetMapping
    public List<UsuarioResponseDTO> listar(@RequestParam(name = "estado", required = false) EstadoCuenta estado,
                                           @RequestParam(name = "rol", required = false) Rol rol) {
        return usuarioAdminService.listar(estado, rol);
    }

    @GetMapping("/pendientes")
    public List<UsuarioResponseDTO> pendientes() {
        return usuarioAdminService.pendientes();
    }

    /** Personal que ya trabaja en el gimnasio (ADMIN, RECEPCIONISTAS y ENTRENADORES aprobados). */
    @GetMapping("/personal")
    public List<UsuarioResponseDTO> personal() {
        return usuarioAdminService.personal();
    }

    /**
     * Agrega un SOCIO, ENTRENADOR, RECEPCIONISTA (máximo 5) o ADMIN (máximo 3 contando al principal).
     * Queda PENDIENTE_VERIFICACION; un nuevo ADMIN solo lo aprueba el administrador principal.
     */
    @PostMapping
    public ResponseEntity<UsuarioResponseDTO> crear(@Valid @RequestBody UsuarioCrearRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(usuarioAdminService.crear(dto));
    }

    /**
     * Body: { "codigo": "482913", "decision": 1 } aprueba; { "codigo": "482913", "decision": 2, "motivo": "..." } rechaza.
     * El código es el que el usuario recibió en su correo. Se le envía un correo con el resultado.
     */
    @PutMapping("/{id}/revision")
    public UsuarioResponseDTO revisar(@PathVariable("id") Long id, @Valid @RequestBody RevisionUsuarioDTO dto,
                                      @AuthenticationPrincipal Usuario admin) {
        return usuarioAdminService.revisar(id, dto, admin);
    }

    @GetMapping("/{id}")
    public UsuarioResponseDTO buscarPorId(@PathVariable("id") Long id) {
        return usuarioAdminService.buscarPorId(id);
    }

    /** Solo cuentas NO aprobadas (pendientes o rechazadas). Las de ADMIN, solo el administrador principal. */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable("id") Long id, @AuthenticationPrincipal Usuario admin) {
        usuarioAdminService.eliminar(id, admin);
        return ResponseEntity.noContent().build();
    }
}
