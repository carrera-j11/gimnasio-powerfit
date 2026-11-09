package com.gimnasio.api.controller;

import com.gimnasio.api.dto.request.EmailRequestDTO;
import com.gimnasio.api.dto.request.LoginRequestDTO;
import com.gimnasio.api.dto.request.RegistroRequestDTO;
import com.gimnasio.api.dto.request.VerificarCodigoDTO;
import com.gimnasio.api.dto.response.LoginResponseDTO;
import com.gimnasio.api.dto.response.MensajeResponseDTO;
import com.gimnasio.api.dto.response.RegistroResponseDTO;
import com.gimnasio.api.dto.response.UsuarioResponseDTO;
import com.gimnasio.api.entity.Usuario;
import com.gimnasio.api.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/registro")
    public ResponseEntity<RegistroResponseDTO> registrar(@Valid @RequestBody RegistroRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.registrar(dto));
    }

    @PostMapping("/verificar")
    public MensajeResponseDTO verificar(@Valid @RequestBody VerificarCodigoDTO dto) {
        return authService.verificarCodigo(dto);
    }

    @PostMapping("/reenviar-codigo")
    public MensajeResponseDTO reenviarCodigo(@Valid @RequestBody EmailRequestDTO dto) {
        return authService.reenviarCodigo(dto);
    }

    @PostMapping("/login")
    public LoginResponseDTO login(@Valid @RequestBody LoginRequestDTO dto) {
        return authService.login(dto);
    }

    @GetMapping("/perfil")
    public UsuarioResponseDTO perfil(@AuthenticationPrincipal Usuario usuario) {
        return authService.perfil(usuario);
    }
}
