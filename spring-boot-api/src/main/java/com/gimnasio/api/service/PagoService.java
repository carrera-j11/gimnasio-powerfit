package com.gimnasio.api.service;

import com.gimnasio.api.dto.request.PagoRequestDTO;
import com.gimnasio.api.dto.response.PagoResponseDTO;
import com.gimnasio.api.entity.*;
import com.gimnasio.api.exception.AccesoDenegadoException;
import com.gimnasio.api.exception.BusinessException;
import com.gimnasio.api.exception.ResourceNotFoundException;
import com.gimnasio.api.mapper.PagoMapper;
import com.gimnasio.api.repository.PagoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PagoService {

    private final PagoRepository pagoRepository;
    private final MembresiaService membresiaService;
    private final SocioService socioService;

    @Transactional(readOnly = true)
    public List<PagoResponseDTO> listar() {
        return pagoRepository.findAllByOrderByIdDesc().stream().map(PagoMapper::toResponse).toList();
    }

    @Transactional
    public List<PagoResponseDTO> listarPorMembresia(Long membresiaId) {
        membresiaService.obtenerEntidad(membresiaId);
        return pagoRepository.findByMembresiaIdOrderByIdDesc(membresiaId).stream().map(PagoMapper::toResponse).toList();
    }

    /** El SOCIO consulta sus propios pagos. */
    @Transactional(readOnly = true)
    public List<PagoResponseDTO> mios(Usuario actual) {
        Socio socio = socioService.obtenerPorUsuario(actual);
        return pagoRepository.findByMembresiaSocioIdOrderByIdDesc(socio.getId()).stream().map(PagoMapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public PagoResponseDTO buscarPorId(Long id, Usuario actual) {
        Pago pago = obtenerEntidad(id);
        if (actual.getRol() == Rol.SOCIO && !pago.getMembresia().getSocio().getUsuario().getId().equals(actual.getId())) {
            throw new AccesoDenegadoException("Un socio solo puede ver sus propios pagos");
        }
        return PagoMapper.toResponse(pago);
    }

    /** ADMIN o RECEPCIONISTA registran un pago de cualquier membresía. */
    @Transactional
    public PagoResponseDTO crear(PagoRequestDTO dto) {
        return registrar(dto, membresiaService.obtenerEntidad(dto.membresiaId()));
    }

    /**
     * El SOCIO paga en línea una de SUS membresías, con TARJETA o TRANSFERENCIA.
     * El efectivo solo se recibe en recepción.
     */
    @Transactional
    public PagoResponseDTO pagar(PagoRequestDTO dto, Usuario actual) {
        Membresia membresia = membresiaService.obtenerEntidad(dto.membresiaId());
        if (!membresia.getSocio().getUsuario().getId().equals(actual.getId())) {
            throw new AccesoDenegadoException("Un socio solo puede pagar sus propias membresías");
        }
        if (dto.metodoPago() == MetodoPago.EFECTIVO) {
            throw new BusinessException("El pago en EFECTIVO se realiza en recepción. En línea puede pagar con TARJETA o TRANSFERENCIA");
        }
        return registrar(dto, membresia);
    }

    private PagoResponseDTO registrar(PagoRequestDTO dto, Membresia membresia) {
        if (membresia.getEstado() == EstadoMembresia.CANCELADA) {
            throw new BusinessException("No se pueden registrar pagos en una membresía cancelada");
        }
        validarReferencia(dto);
        BigDecimal saldo = membresia.getPlan().getPrecio().subtract(pagoRepository.totalPagado(membresia.getId()));
        validarMonto(dto.monto(), saldo);

        Pago pago = new Pago();
        pago.setMembresia(membresia);
        pago.setMonto(dto.monto());
        pago.setMetodoPago(dto.metodoPago());
        pago.setReferencia(limpiar(dto.referencia()));
        return PagoMapper.toResponse(pagoRepository.save(pago));
    }

    @Transactional
    public PagoResponseDTO actualizar(Long id, PagoRequestDTO dto) {
        Pago pago = obtenerEntidad(id);
        Membresia membresia = pago.getMembresia();
        if (!membresia.getId().equals(dto.membresiaId())) {
            throw new BusinessException("No se puede cambiar la membresía de un pago ya registrado");
        }
        validarReferencia(dto);
        // Saldo sin contar el monto anterior de este mismo pago
        BigDecimal saldo = membresia.getPlan().getPrecio()
                .subtract(pagoRepository.totalPagado(membresia.getId())).add(pago.getMonto());
        validarMonto(dto.monto(), saldo);

        pago.setMonto(dto.monto());
        pago.setMetodoPago(dto.metodoPago());
        pago.setReferencia(limpiar(dto.referencia()));
        return PagoMapper.toResponse(pagoRepository.save(pago));
    }

    @Transactional
    public void eliminar(Long id) {
        pagoRepository.delete(obtenerEntidad(id));
    }

    private Pago obtenerEntidad(Long id) {
        return pagoRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Pago", id));
    }

    private void validarMonto(BigDecimal monto, BigDecimal saldo) {
        if (saldo.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("La membresía ya está pagada en su totalidad");
        }
        if (monto.compareTo(saldo) > 0) {
            throw new BusinessException("El monto $" + monto + " supera el saldo pendiente de $" + saldo);
        }
    }

    private void validarReferencia(PagoRequestDTO dto) {
        if (dto.metodoPago() == MetodoPago.TRANSFERENCIA && (dto.referencia() == null || dto.referencia().isBlank())) {
            throw new BusinessException("Para pagos por TRANSFERENCIA el número de referencia es obligatorio");
        }
    }

    private String limpiar(String texto) {
        return texto == null || texto.isBlank() ? null : texto.trim();
    }
}
