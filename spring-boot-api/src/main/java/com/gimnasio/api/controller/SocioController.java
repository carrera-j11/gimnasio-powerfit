package com.gimnasio.api.controller;

import com.gimnasio.api.dto.request.SocioUpdateDTO;
import com.gimnasio.api.dto.response.SocioResponseDTO;
import com.gimnasio.api.entity.Usuario;
import com.gimnasio.api.service.SocioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Los socios se crean con POST /api/auth/registro (rolSolicitado=SOCIO) y los aprueba un ADMIN. */
@RestController
@RequestMapping("/api/socios")
@RequiredArgsConstructor
public class SocioController {

    private final SocioService socioService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','RECEPCIONISTA')")
    public List<SocioResponseDTO> listar() {
        return socioService.listar();
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('SOCIO')")
    public SocioResponseDTO miPerfil(@AuthenticationPrincipal Usuario actual) {
        return socioService.miPerfil(actual);
    }

    @GetMapping("/cedula/{cedula}")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPCIONISTA')")
    public SocioResponseDTO buscarPorCedula(@PathVariable("cedula") String cedula) {
        return socioService.buscarPorCedula(cedula);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPCIONISTA','SOCIO')")
    public SocioResponseDTO buscarPorId(@PathVariable("id") Long id, @AuthenticationPrincipal Usuario actual) {
        return socioService.buscarPorId(id, actual);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPCIONISTA','SOCIO')")
    public SocioResponseDTO actualizar(@PathVariable("id") Long id, @Valid @RequestBody SocioUpdateDTO dto,
                                       @AuthenticationPrincipal Usuario actual) {
        return socioService.actualizar(id, dto, actual);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminar(@PathVariable("id") Long id) {
        socioService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
