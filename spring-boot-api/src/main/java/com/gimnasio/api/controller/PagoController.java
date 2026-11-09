package com.gimnasio.api.controller;

import com.gimnasio.api.dto.request.PagoRequestDTO;
import com.gimnasio.api.dto.response.PagoResponseDTO;
import com.gimnasio.api.entity.Usuario;
import com.gimnasio.api.service.PagoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pagos")
@RequiredArgsConstructor
public class PagoController {

    private final PagoService pagoService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','RECEPCIONISTA')")
    public List<PagoResponseDTO> listar() {
        return pagoService.listar();
    }

    @GetMapping("/mios")
    @PreAuthorize("hasRole('SOCIO')")
    public List<PagoResponseDTO> mios(@AuthenticationPrincipal Usuario actual) {
        return pagoService.mios(actual);
    }

    @GetMapping("/membresia/{membresiaId}")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPCIONISTA')")
    public List<PagoResponseDTO> listarPorMembresia(@PathVariable("membresiaId") Long membresiaId) {
        return pagoService.listarPorMembresia(membresiaId);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPCIONISTA','SOCIO')")
    public PagoResponseDTO buscarPorId(@PathVariable("id") Long id, @AuthenticationPrincipal Usuario actual) {
        return pagoService.buscarPorId(id, actual);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','RECEPCIONISTA')")
    public ResponseEntity<PagoResponseDTO> crear(@Valid @RequestBody PagoRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(pagoService.crear(dto));
    }

    /** El SOCIO paga en línea su membresía (TARJETA o TRANSFERENCIA). */
    @PostMapping("/pagar")
    @PreAuthorize("hasRole('SOCIO')")
    public ResponseEntity<PagoResponseDTO> pagar(@Valid @RequestBody PagoRequestDTO dto,
                                                 @AuthenticationPrincipal Usuario actual) {
        return ResponseEntity.status(HttpStatus.CREATED).body(pagoService.pagar(dto, actual));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPCIONISTA')")
    public PagoResponseDTO actualizar(@PathVariable("id") Long id, @Valid @RequestBody PagoRequestDTO dto) {
        return pagoService.actualizar(id, dto);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminar(@PathVariable("id") Long id) {
        pagoService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
