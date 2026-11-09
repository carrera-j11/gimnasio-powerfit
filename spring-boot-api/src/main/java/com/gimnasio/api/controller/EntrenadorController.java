package com.gimnasio.api.controller;

import com.gimnasio.api.dto.request.EntrenadorUpdateDTO;
import com.gimnasio.api.dto.response.EntrenadorResponseDTO;
import com.gimnasio.api.entity.Usuario;
import com.gimnasio.api.service.EntrenadorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/entrenadores")
@RequiredArgsConstructor
public class EntrenadorController {

    private final EntrenadorService entrenadorService;

    @GetMapping
    public List<EntrenadorResponseDTO> listar() {
        return entrenadorService.listar();
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('ENTRENADOR')")
    public EntrenadorResponseDTO miPerfil(@AuthenticationPrincipal Usuario actual) {
        return entrenadorService.miPerfil(actual);
    }

    @GetMapping("/{id}")
    public EntrenadorResponseDTO buscarPorId(@PathVariable("id") Long id) {
        return entrenadorService.buscarPorId(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','ENTRENADOR')")
    public EntrenadorResponseDTO actualizar(@PathVariable("id") Long id, @Valid @RequestBody EntrenadorUpdateDTO dto,
                                            @AuthenticationPrincipal Usuario actual) {
        return entrenadorService.actualizar(id, dto, actual);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminar(@PathVariable("id") Long id) {
        entrenadorService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
