package com.gimnasio.api.security;

import com.gimnasio.api.entity.EstadoCuenta;
import com.gimnasio.api.entity.Usuario;
import com.gimnasio.api.repository.UsuarioRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Optional;


public class JwtAuthenticationFilter extends OncePerRequestFilter {

    public static final String ATRIBUTO_ERROR = "jwt_error";

    private final JwtService jwtService;
    private final UsuarioRepository usuarioRepository;

    public JwtAuthenticationFilter(JwtService jwtService, UsuarioRepository usuarioRepository) {
        this.jwtService = jwtService;
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        String header = request.getHeader("Authorization");

        // Sin token: se deja pasar; si la ruta es protegida, Spring Security responderá 401
        if (header == null || !header.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }

        String token = header.substring(7);
        try {
            Claims claims = jwtService.validarToken(token);
            Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(claims.getSubject());

            if (usuarioOpt.isEmpty()) {
                request.setAttribute(ATRIBUTO_ERROR, "El usuario del token ya no existe");
            } else if (usuarioOpt.get().getEstado() != EstadoCuenta.APROBADA) {
                request.setAttribute(ATRIBUTO_ERROR, "La cuenta ya no está aprobada (estado: " + usuarioOpt.get().getEstado() + ")");
            } else {
                Usuario usuario = usuarioOpt.get();
                // El rol se toma de la BD (no del token) por si el ADMIN lo cambió después del login
                var autoridades = List.of(new SimpleGrantedAuthority("ROLE_" + usuario.getRol().name()));
                var autenticacion = new UsernamePasswordAuthenticationToken(usuario, null, autoridades);
                autenticacion.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(autenticacion);
            }
        } catch (ExpiredJwtException e) {
            request.setAttribute(ATRIBUTO_ERROR, "El token ha expirado, inicie sesión nuevamente");
        } catch (JwtException | IllegalArgumentException e) {
            request.setAttribute(ATRIBUTO_ERROR, "El token no es válido (fue alterado o está mal formado)");
        }

        chain.doFilter(request, response);
    }
}
