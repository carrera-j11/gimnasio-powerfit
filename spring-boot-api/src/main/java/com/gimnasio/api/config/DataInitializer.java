package com.gimnasio.api.config;

import com.gimnasio.api.entity.*;
import com.gimnasio.api.repository.PlanMembresiaRepository;
import com.gimnasio.api.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Al arrancar crea (si no existen):
 * - Los 3 planes del gimnasio: QUINCENAL, MENSUAL y ANUAL.
 * - El primer ADMIN (sin él nadie podría aprobar las cuentas).
 */
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UsuarioRepository usuarioRepository;
    private final PlanMembresiaRepository planRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.cedula}")
    private String cedula;
    @Value("${app.admin.nombres}")
    private String nombres;
    @Value("${app.admin.apellidos}")
    private String apellidos;
    @Value("${app.admin.email}")
    private String email;
    @Value("${app.admin.celular}")
    private String celular;
    @Value("${app.admin.password}")
    private String password;

    @Override
    public void run(String... args) {
        crearPlan(TipoPlan.QUINCENAL, "18.00", "Acceso libre al gimnasio por 15 días");
        crearPlan(TipoPlan.MENSUAL, "30.00", "Acceso libre por 30 días + 1 evaluación física");
        crearPlan(TipoPlan.ANUAL, "300.00", "Acceso libre por 1 año + evaluaciones físicas trimestrales");
        crearAdmin();
    }

    private void crearPlan(TipoPlan tipo, String precio, String descripcion) {
        if (planRepository.existsByTipo(tipo)) {
            return;
        }
        PlanMembresia plan = new PlanMembresia();
        plan.setTipo(tipo);
        plan.setNombre(tipo.getNombre());
        plan.setDuracionDias(tipo.getDias());
        plan.setPrecio(new BigDecimal(precio));
        plan.setDescripcion(descripcion);
        planRepository.save(plan);
        log.info(">>> Plan creado: {}", tipo);
    }

    private void crearAdmin() {
        String correo = email.trim().toLowerCase();
        if (usuarioRepository.existsByEmail(correo)) {
            return;
        }
        Usuario admin = new Usuario();
        admin.setCedula(cedula);
        admin.setNombres(nombres);
        admin.setApellidos(apellidos);
        admin.setEmail(correo);
        admin.setCelular(celular);
        admin.setFechaNacimiento(LocalDate.of(1990, 1, 1));
        admin.setPassword(passwordEncoder.encode(password));
        admin.setRol(Rol.ADMIN);
        admin.setEstado(EstadoCuenta.APROBADA);
        admin.setFechaVerificacion(LocalDateTime.now());
        admin.setFechaAprobacion(LocalDateTime.now());
        usuarioRepository.save(admin);
        log.info(">>> Administrador inicial creado: {}", correo);
    }
}
