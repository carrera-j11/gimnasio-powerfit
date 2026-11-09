const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sequelize, Usuario, Socio, Entrenador } = require('../models');
const AppError = require('../utils/AppError');
const email = require('../utils/email');
const { validarNuevaCuenta, crearPerfil } = require('../utils/cuentas');
const { usuarioResponse } = require('../utils/mappers');

const MINUTOS = () => Number(process.env.CODIGO_MINUTOS_EXPIRACION || 15);
const MAX_INTENTOS = () => Number(process.env.CODIGO_MAX_INTENTOS || 5);

function nuevoCodigo(usuario) {
  const codigo = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  usuario.codigoVerificacion = codigo;
  usuario.codigoExpiracion = new Date(Date.now() + MINUTOS() * 60000);
  usuario.intentosVerificacion = 0;
  return codigo;
}

async function buscarPorEmail(correo) {
  const usuario = await Usuario.findOne({ where: { email: correo } });
  if (!usuario) throw AppError.notFound(`No existe una cuenta registrada con el email ${correo}. Verifique que lo escribió igual que en el registro`);
  return usuario;
}

/** Id del perfil (socio o entrenador) del usuario; null para ADMIN y RECEPCIONISTA. */
async function perfilId(usuario) {
  if (usuario.rol === 'SOCIO') return (await Socio.findOne({ where: { usuarioId: usuario.id } }))?.id ?? null;
  if (usuario.rol === 'ENTRENADOR') return (await Entrenador.findOne({ where: { usuarioId: usuario.id } }))?.id ?? null;
  return null;
}

async function validarRegistro(datos) {
  if (datos.password !== datos.confirmarPassword) {
    throw AppError.badRequest('La contraseña y la confirmación no coinciden: escriba exactamente la misma contraseña en ambos campos');
  }
  // Rol, edad, máximo de recepcionistas y cédula / email / celular únicos
  await validarNuevaCuenta({ ...datos, rol: datos.rolSolicitado });
}

/** Paso 1: crea la cuenta (PENDIENTE_VERIFICACION), su perfil y envía el código al correo. */
async function registro(req, res) {
  const datos = req.body;
  await validarRegistro(datos);

  // Transacción: si el correo no se puede enviar, no queda nada guardado
  const t = await sequelize.transaction();
  try {
    const usuario = Usuario.build({
      cedula: datos.cedula,
      nombres: datos.nombres,
      apellidos: datos.apellidos,
      email: datos.email,
      celular: datos.celular,
      fechaNacimiento: datos.fechaNacimiento,
      password: await bcrypt.hash(datos.password, 10),
      rol: datos.rolSolicitado,
      estado: 'PENDIENTE_VERIFICACION'
    });
    const codigo = nuevoCodigo(usuario);
    await usuario.save({ transaction: t });

    const idPerfil = await crearPerfil(usuario, datos, t);

    await email.enviarCodigoVerificacion(usuario, codigo, MINUTOS());
    await t.commit();

    res.status(201).json({
      mensaje: `Registro exitoso. Enviamos un código de 6 dígitos a ${usuario.email}. Entregue ese código al administrador (vence en ${MINUTOS()} minutos) para que lo valide y apruebe su cuenta`,
      usuarioId: usuario.id,
      perfilId: idPerfil,
      email: usuario.email,
      rolSolicitado: usuario.rol,
      estado: usuario.estado
    });
  } catch (error) {
    if (!t.finished) await t.rollback();
    throw error;
  }
}

// Paso 2: el usuario entrega el código al ADMIN, que lo valida y aprueba / rechaza (admin.controller -> revisar)

async function reenviarCodigo(req, res) {
  const usuario = await buscarPorEmail(req.body.email);
  if (usuario.estado !== 'PENDIENTE_VERIFICACION') {
    throw AppError.badRequest(`El correo ${usuario.email} ya fue verificado, no necesita un código nuevo`);
  }
  const codigo = nuevoCodigo(usuario);
  await usuario.save();
  await email.enviarCodigoVerificacion(usuario, codigo, MINUTOS());
  res.json({ mensaje: `Se envió un nuevo código a ${usuario.email}` });
}

/** Paso 4: solo las cuentas APROBADAS reciben el JWT. */
async function login(req, res) {
  const usuario = await Usuario.findOne({ where: { email: req.body.email } });
  // Mismo mensaje en ambos casos para no revelar qué emails existen
  if (!usuario || !(await bcrypt.compare(req.body.password, usuario.password))) {
    throw AppError.unauthorized('Email o contraseña incorrectos');
  }

  const mensajesPorEstado = {
    PENDIENTE_VERIFICACION: `Su cuenta está pendiente: entregue al administrador el código enviado a ${usuario.email} para que lo valide y apruebe su cuenta`,
    PENDIENTE_APROBACION: 'Su cuenta está pendiente de aprobación por un administrador',
    RECHAZADA: `Su cuenta fue rechazada. Motivo: ${usuario.motivoRechazo}`
  };
  if (usuario.estado !== 'APROBADA') {
    throw AppError.forbidden(mensajesPorEstado[usuario.estado]);
  }

  const token = jwt.sign(
    { id: usuario.id, email: usuario.email, rol: usuario.rol, nombre: `${usuario.nombres} ${usuario.apellidos}` },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );
  const { exp, iat } = jwt.decode(token);

  res.json({ token, tipo: 'Bearer', expiraEnSegundos: exp - iat, usuario: usuarioResponse(usuario, await perfilId(usuario)) });
}

async function perfil(req, res) {
  res.json(usuarioResponse(req.usuario, await perfilId(req.usuario)));
}

module.exports = { registro, reenviarCodigo, login, perfil, perfilId, nuevoCodigo, MINUTOS, MAX_INTENTOS };
