package com.gimnasio.api.controller;

import com.gimnasio.api.dto.request.MembresiaRequestDTO;
import com.gimnasio.api.dto.request.MembresiaUpdateDTO;
import com.gimnasio.api.dto.response.MembresiaResponseDTO;
import com.gimnasio.api.entity.Usuario;
import com.gimnasio.api.service.MembresiaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/membresias")
@RequiredArgsConstructor
public class MembresiaController {

    private final MembresiaService membresiaService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','RECEPCIONISTA')")
    public List<MembresiaResponseDTO> listar() {
        return membresiaService.listar();
    }

    @GetMapping("/mias")
    @PreAuthorize("hasRole('SOCIO')")
    public List<MembresiaResponseDTO> mias(@AuthenticationPrincipal Usuario actual) {
        return membresiaService.mias(actual);
    }

    @GetMapping("/socio/{socioId}")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPCIONISTA')")
    public List<MembresiaResponseDTO> listarPorSocio(@PathVariable("socioId") Long socioId) {
        return membresiaService.listarPorSocio(socioId);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPCIONISTA','SOCIO')")
    public MembresiaResponseDTO buscarPorId(@PathVariable("id") Long id, @AuthenticationPrincipal Usuario actual) {
        return membresiaService.buscarPorId(id, actual);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','RECEPCIONISTA')")
    public ResponseEntity<MembresiaResponseDTO> crear(@Valid @RequestBody MembresiaRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(membresiaService.crear(dto));
    }

    /** El SOCIO contrata su propia membresía: { "tipoPlan": "MENSUAL", "fechaInicio": "2026-10-08" } */
    @PostMapping("/contratar")
    @PreAuthorize("hasRole('SOCIO')")
    public ResponseEntity<MembresiaResponseDTO> contratar(@Valid @RequestBody MembresiaUpdateDTO dto,
                                                          @AuthenticationPrincipal Usuario actual) {
        return ResponseEntity.status(HttpStatus.CREATED).body(membresiaService.contratar(dto, actual));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPCIONISTA')")
    public MembresiaResponseDTO actualizar(@PathVariable("id") Long id, @Valid @RequestBody MembresiaUpdateDTO dto) {
        return membresiaService.actualizar(id, dto);
    }

    @PatchMapping("/{id}/cancelar")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPCIONISTA')")
    public MembresiaResponseDTO cancelar(@PathVariable("id") Long id) {
        return membresiaService.cancelar(id);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminar(@PathVariable("id") Long id) {
        membresiaService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
