package com.gimnasio.api.controller;

import com.gimnasio.api.dto.request.InscripcionRequestDTO;
import com.gimnasio.api.dto.response.InscripcionResponseDTO;
import com.gimnasio.api.entity.Usuario;
import com.gimnasio.api.service.InscripcionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Una inscripción no se edita: se cancela (DELETE) y se crea otra. */
@RestController
@RequestMapping("/api/inscripciones")
@RequiredArgsConstructor
public class InscripcionController {

    private final InscripcionService inscripcionService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','RECEPCIONISTA')")
    public List<InscripcionResponseDTO> listar() {
        return inscripcionService.listar();
    }

    @GetMapping("/mias")
    @PreAuthorize("hasRole('SOCIO')")
    public List<InscripcionResponseDTO> mias(@AuthenticationPrincipal Usuario actual) {
        return inscripcionService.mias(actual);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','RECEPCIONISTA','SOCIO')")
    public ResponseEntity<InscripcionResponseDTO> crear(@Valid @RequestBody InscripcionRequestDTO dto,
                                                        @AuthenticationPrincipal Usuario actual) {
        return ResponseEntity.status(HttpStatus.CREATED).body(inscripcionService.crear(dto, actual));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPCIONISTA','SOCIO')")
    public ResponseEntity<Void> eliminar(@PathVariable("id") Long id, @AuthenticationPrincipal Usuario actual) {
        inscripcionService.eliminar(id, actual);
        return ResponseEntity.noContent().build();
    }
}
