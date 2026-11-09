package com.gimnasio.api.controller;

import com.gimnasio.api.dto.request.ClaseRequestDTO;
import com.gimnasio.api.dto.response.ClaseResponseDTO;
import com.gimnasio.api.dto.response.InscripcionResponseDTO;
import com.gimnasio.api.entity.Usuario;
import com.gimnasio.api.service.ClaseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Cualquier usuario con sesión ve las clases; las crean el ADMIN (indicando el entrenador) o el ENTRENADOR. */
@RestController
@RequestMapping("/api/clases")
@RequiredArgsConstructor
public class ClaseController {

    private final ClaseService claseService;

    @GetMapping
    public List<ClaseResponseDTO> listar() {
        return claseService.listar();
    }

    @GetMapping("/mias")
    @PreAuthorize("hasRole('ENTRENADOR')")
    public List<ClaseResponseDTO> mias(@AuthenticationPrincipal Usuario actual) {
        return claseService.mias(actual);
    }

    @GetMapping("/{id}")
    public ClaseResponseDTO buscarPorId(@PathVariable("id") Long id) {
        return claseService.buscarPorId(id);
    }

    @GetMapping("/{id}/inscritos")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPCIONISTA','ENTRENADOR')")
    public List<InscripcionResponseDTO> inscritos(@PathVariable("id") Long id, @AuthenticationPrincipal Usuario actual) {
        return claseService.inscritos(id, actual);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','ENTRENADOR')")
    public ResponseEntity<ClaseResponseDTO> crear(@Valid @RequestBody ClaseRequestDTO dto,
                                                  @AuthenticationPrincipal Usuario actual) {
        return ResponseEntity.status(HttpStatus.CREATED).body(claseService.crear(dto, actual));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','ENTRENADOR')")
    public ClaseResponseDTO actualizar(@PathVariable("id") Long id, @Valid @RequestBody ClaseRequestDTO dto,
                                       @AuthenticationPrincipal Usuario actual) {
        return claseService.actualizar(id, dto, actual);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','ENTRENADOR')")
    public ResponseEntity<Void> eliminar(@PathVariable("id") Long id, @AuthenticationPrincipal Usuario actual) {
        claseService.eliminar(id, actual);
        return ResponseEntity.noContent().build();
    }
}
