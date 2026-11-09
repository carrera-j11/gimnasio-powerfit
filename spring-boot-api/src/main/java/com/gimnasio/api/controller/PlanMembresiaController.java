package com.gimnasio.api.controller;

import com.gimnasio.api.dto.request.PlanUpdateDTO;
import com.gimnasio.api.dto.response.PlanResponseDTO;
import com.gimnasio.api.entity.TipoPlan;
import com.gimnasio.api.service.PlanMembresiaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Solo existen 3 planes (QUINCENAL, MENSUAL, ANUAL): no hay POST ni DELETE.
 * Consultar es público (lo usan la página web y los frontends); modificar, solo ADMIN.
 */
@RestController
@RequestMapping("/api/planes")
@RequiredArgsConstructor
public class PlanMembresiaController {

    private final PlanMembresiaService planService;

    @GetMapping
    public List<PlanResponseDTO> listar() {
        return planService.listar();
    }

    @GetMapping("/{tipo}")
    public PlanResponseDTO buscar(@PathVariable("tipo") TipoPlan tipo) {
        return planService.buscar(tipo);
    }

    @PutMapping("/{tipo}")
    @PreAuthorize("hasRole('ADMIN')")
    public PlanResponseDTO actualizar(@PathVariable("tipo") TipoPlan tipo, @Valid @RequestBody PlanUpdateDTO dto) {
        return planService.actualizar(tipo, dto);
    }
}
