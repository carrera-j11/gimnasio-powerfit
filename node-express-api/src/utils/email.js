const nodemailer = require('nodemailer');
const AppError = require('./AppError');
const { nombreCompleto } = require('./mappers');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465, // 587 y 2525 usan STARTTLS
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  connectionTimeout: 10000
});

/**
 * Envía el código de verificación al email que la persona escribió al registrarse.
 * Si falla (y el plan B está desactivado) lanza 503 y el registro se deshace.
 */
async function enviarCodigoVerificacion(usuario, codigo, minutos) {
  const mostrarEnConsola = process.env.MOSTRAR_CODIGO_EN_CONSOLA === 'true';
  if (mostrarEnConsola) {
    console.log(`>>> Código de verificación para ${usuario.email}: ${codigo}`);
  }
  const html = `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;border:1px solid #ddd;border-radius:10px">
    <h2 style="color:#1d1d1f">🏋️ Confirma tu correo</h2>
    <p>Hola <b>${nombreCompleto(usuario)}</b>, recibimos tu solicitud para crear una cuenta en el Gimnasio PowerFit como <b>${usuario.rol}</b>.</p>
    <p>Para confirmar que este correo es tuyo, <b>entrégale este código al administrador</b> del gimnasio, quien lo validará y revisará tu solicitud:</p>
    <div style="font-size:34px;font-weight:bold;letter-spacing:10px;color:#e4572e;margin:18px 0">${codigo}</div>
    <p>El código vence en <b>${minutos} minutos</b>.</p>
    <p style="color:#666">Si no solicitaste esta cuenta, ignora este mensaje.</p>
    <hr><small style="color:#888">Gimnasio PowerFit - mensaje automático, no responder</small></div>`;

  try {
    const remitente = process.env.MAIL_FROM || process.env.SMTP_USER;
    await transporter.sendMail({
      from: `"Gimnasio PowerFit" <${remitente}>`,
      to: usuario.email,
      subject: `Tu código de verificación: ${codigo} - Gimnasio PowerFit`,
      html
    });
    console.log(`Código de verificación enviado a ${usuario.email}`);
  } catch (error) {
    console.error(`No se pudo enviar el correo a ${usuario.email}: ${error.message}`);
    if (!mostrarEnConsola) {
      throw new AppError(503, `No se pudo enviar el correo de verificación a ${usuario.email}. Revise que el correo exista y que la configuración SMTP del archivo .env sea correcta`);
    }
  }
}

/**
 * Avisa al usuario el resultado de la revisión del ADMIN, con sus datos y su id.
 * Si falla solo se registra en la consola: la decisión del ADMIN ya quedó guardada.
 */
async function enviarResultadoRevision(usuario, perfilId) {
  const aprobada = usuario.estado === 'APROBADA';
  const fila = (etiqueta, valor) => `<tr><td style="padding:4px 12px 4px 0;color:#666">${etiqueta}</td><td><b>${valor}</b></td></tr>`;
  const datos = `<table style="margin:12px 0">
    ${fila('ID de usuario', usuario.id)}
    ${perfilId ? fila(`ID de ${usuario.rol.toLowerCase()}`, perfilId) : ''}
    ${fila('Nombre', nombreCompleto(usuario))}
    ${fila('Cédula', usuario.cedula)}
    ${fila('Email', usuario.email)}
    ${fila('Celular', usuario.celular)}
    ${fila('Fecha de nacimiento', usuario.fechaNacimiento)}
    ${fila('Rol', usuario.rol)}
    ${fila('Estado', usuario.estado)}
  </table>`;
  const resultado = aprobada
    ? '<p style="color:#2e7d32;font-size:18px"><b>✅ Tu cuenta fue APROBADA.</b></p><p>Ya puedes iniciar sesión con tu email y contraseña.</p>'
    : `<p style="color:#c62828;font-size:18px"><b>❌ Tu cuenta fue RECHAZADA.</b></p><p>Motivo: <b>${usuario.motivoRechazo}</b></p>`;

  const html = `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;border:1px solid #ddd;border-radius:10px">
    <h2 style="color:#1d1d1f">🏋️ Resultado de tu solicitud</h2>
    <p>Hola <b>${nombreCompleto(usuario)}</b>, el administrador validó tu código de verificación y revisó tu solicitud para el Gimnasio PowerFit.</p>
    ${resultado}
    <p>Estos son tus datos registrados:</p>${datos}
    <hr><small style="color:#888">Gimnasio PowerFit - mensaje automático, no responder</small></div>`;

  try {
    const remitente = process.env.MAIL_FROM || process.env.SMTP_USER;
    await transporter.sendMail({
      from: `"Gimnasio PowerFit" <${remitente}>`,
      to: usuario.email,
      subject: `Tu cuenta fue ${aprobada ? 'APROBADA' : 'RECHAZADA'} - Gimnasio PowerFit`,
      html
    });
    console.log(`Resultado de la revisión (${usuario.estado}) enviado a ${usuario.email}`);
  } catch (error) {
    console.error(`No se pudo enviar el resultado de la revisión a ${usuario.email}: ${error.message}`);
  }
}

module.exports = { enviarCodigoVerificacion, enviarResultadoRevision };
