package com.gimnasio.api.service;

import com.gimnasio.api.entity.EstadoCuenta;
import com.gimnasio.api.entity.Usuario;
import com.gimnasio.api.exception.EmailException;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;
import java.util.Map;


@Service
@RequiredArgsConstructor
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${app.mail.remitente:${spring.mail.username}}")
    private String remitente;

    @Value("${app.verificacion.mostrar-codigo-en-consola:false}")
    private boolean mostrarCodigoEnConsola;

    /** Si se define, el correo se envía por la API HTTPS de Brevo (puerto 443) en lugar de SMTP.
     *  Necesario en Railway, que bloquea los puertos SMTP en los planes Free/Trial/Hobby. */
    @Value("${app.mail.brevo-api-key:}")
    private String brevoApiKey;

    @Value("${app.mail.remitente-nombre:Gimnasio PowerFit}")
    private String remitenteNombre;

    private final RestClient brevo = RestClient.builder().baseUrl("https://api.brevo.com/v3").build();


    public void enviarCodigoVerificacion(Usuario usuario, String codigo, int minutos) {
        if (mostrarCodigoEnConsola) {
            log.info(">>> Código de verificación para {}: {}", usuario.getEmail(), codigo);
        }
        String html = "<div style='font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;"
                + "border:1px solid #ddd;border-radius:10px'>"
                + "<h2 style='color:#1d1d1f'>🏋️ Confirma tu correo</h2>"
                + "<p>Hola <b>" + usuario.getNombreCompleto() + "</b>, recibimos tu solicitud para crear una cuenta en el "
                + "Gimnasio PowerFit como <b>" + usuario.getRol() + "</b>.</p>"
                + "<p>Para confirmar que este correo es tuyo, <b>ingresa este código en la página de verificación</b>. "
                + "Después, un administrador revisará tu solicitud:</p>"
                + "<div style='font-size:34px;font-weight:bold;letter-spacing:10px;color:#e4572e;margin:18px 0'>"
                + codigo + "</div>"
                + "<p>El código vence en <b>" + minutos + " minutos</b>.</p>"
                + "<p style='color:#666'>Si no solicitaste esta cuenta, ignora este mensaje.</p>"
                + "<hr><small style='color:#888'>Gimnasio PowerFit - mensaje automático, no responder</small></div>";
        try {
            enviar(usuario.getEmail(), "Tu código de verificación: " + codigo + " - Gimnasio PowerFit", html);
            log.info("Código de verificación enviado a {}", usuario.getEmail());
        } catch (MailException | MessagingException | RestClientException e) {
            log.error("No se pudo enviar el correo a {}: {}", usuario.getEmail(), e.getMessage());
            if (!mostrarCodigoEnConsola) {
                throw new EmailException("No se pudo enviar el correo de verificación a " + usuario.getEmail()
                        + ". Revise que el correo exista y que la configuración de correo (spring.mail.*) sea correcta");
            }
        }
    }

    
    public void enviarResultadoRevision(Usuario usuario, Long perfilId) {
        boolean aprobada = usuario.getEstado() == EstadoCuenta.APROBADA;
        String fila = "<tr><td style='padding:4px 12px 4px 0;color:#666'>%s</td><td><b>%s</b></td></tr>";
        StringBuilder datos = new StringBuilder("<table style='margin:12px 0'>")
                .append(String.format(fila, "ID de usuario", usuario.getId()));
        if (perfilId != null) {
            datos.append(String.format(fila, "ID de " + usuario.getRol().name().toLowerCase(), perfilId));
        }
        datos.append(String.format(fila, "Nombre", usuario.getNombreCompleto()))
                .append(String.format(fila, "Cédula", usuario.getCedula()))
                .append(String.format(fila, "Email", usuario.getEmail()))
                .append(String.format(fila, "Celular", usuario.getCelular()))
                .append(String.format(fila, "Fecha de nacimiento", usuario.getFechaNacimiento()))
                .append(String.format(fila, "Rol", usuario.getRol()))
                .append(String.format(fila, "Estado", usuario.getEstado()))
                .append("</table>");

        String resultado = aprobada
                ? "<p style='color:#2e7d32;font-size:18px'><b>✅ Tu cuenta fue APROBADA.</b></p>"
                + "<p>Ya puedes iniciar sesión con tu email y contraseña.</p>"
                : "<p style='color:#c62828;font-size:18px'><b>❌ Tu cuenta fue RECHAZADA.</b></p>"
                + "<p>Motivo: <b>" + usuario.getMotivoRechazo() + "</b></p>";

        String html = "<div style='font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;"
                + "border:1px solid #ddd;border-radius:10px'>"
                + "<h2 style='color:#1d1d1f'>🏋️ Resultado de tu solicitud</h2>"
                + "<p>Hola <b>" + usuario.getNombreCompleto() + "</b>, el administrador revisó tu solicitud "
                + "para el Gimnasio PowerFit.</p>"
                + resultado
                + "<p>Estos son tus datos registrados:</p>" + datos
                + "<hr><small style='color:#888'>Gimnasio PowerFit - mensaje automático, no responder</small></div>";
        try {
            enviar(usuario.getEmail(), "Tu cuenta fue " + (aprobada ? "APROBADA" : "RECHAZADA") + " - Gimnasio PowerFit", html);
            log.info("Resultado de la revisión ({}) enviado a {}", usuario.getEstado(), usuario.getEmail());
        } catch (MailException | MessagingException | RestClientException e) {
            log.error("No se pudo enviar el resultado de la revisión a {}: {}", usuario.getEmail(), e.getMessage());
        }
    }

    /** Envía el correo por la API de Brevo si hay clave configurada; si no, por SMTP. */
    private void enviar(String para, String asunto, String html) throws MessagingException {
        if (brevoApiKey != null && !brevoApiKey.isBlank()) {
            brevo.post()
                    .uri("/smtp/email")
                    .header("api-key", brevoApiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "sender", Map.of("name", remitenteNombre, "email", remitente),
                            "to", List.of(Map.of("email", para)),
                            "subject", asunto,
                            "htmlContent", html))
                    .retrieve()
                    .toBodilessEntity();
            return;
        }
        MimeMessage mensaje = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(mensaje, "UTF-8");
        helper.setFrom(remitente);
        helper.setTo(para);
        helper.setSubject(asunto);
        helper.setText(html, true);
        mailSender.send(mensaje);
    }
}
