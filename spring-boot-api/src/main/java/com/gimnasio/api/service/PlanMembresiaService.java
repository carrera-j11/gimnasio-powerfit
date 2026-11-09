package com.gimnasio.api.service;

import com.gimnasio.api.dto.request.PlanUpdateDTO;
import com.gimnasio.api.dto.response.PlanResponseDTO;
import com.gimnasio.api.entity.PlanMembresia;
import com.gimnasio.api.entity.TipoPlan;
import com.gimnasio.api.exception.ResourceNotFoundException;
import com.gimnasio.api.mapper.PlanMapper;
import com.gimnasio.api.repository.PlanMembresiaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Solo 3 planes fijos: no se crean ni se eliminan; el ADMIN cambia precio y descripción. */
@Service
@RequiredArgsConstructor
public class PlanMembresiaService {

    private final PlanMembresiaRepository planRepository;

    @Transactional(readOnly = true)
    public List<PlanResponseDTO> listar() {
        return planRepository.findAllByOrderByDuracionDiasAsc().stream().map(PlanMapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public PlanResponseDTO buscar(TipoPlan tipo) {
        return PlanMapper.toResponse(obtenerPorTipo(tipo));
    }

    @Transactional
    public PlanResponseDTO actualizar(TipoPlan tipo, PlanUpdateDTO dto) {
        PlanMembresia plan = obtenerPorTipo(tipo);
        plan.setPrecio(dto.precio());
        plan.setDescripcion(dto.descripcion() == null || dto.descripcion().isBlank() ? null : dto.descripcion().trim());
        return PlanMapper.toResponse(planRepository.save(plan));
    }

    public PlanMembresia obtenerPorTipo(TipoPlan tipo) {
        return planRepository.findByTipo(tipo)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el plan " + tipo));
    }
}
