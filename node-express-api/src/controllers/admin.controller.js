const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { sequelize, Usuario, Socio, Entrenador } = require('../models');
const AppError = require('../utils/AppError');
const { hoy } = require('../utils/fechas');
const { usuarioResponse } = require('../utils/mappers');
const { perfilId, nuevoCodigo, MINUTOS, MAX_INTENTOS } = require('./auth.controller');
const { validarNuevaCuenta, crearPerfil } = require('../utils/cuentas');
const email = require('../utils/email');

const DECISION_APROBAR = 1;

async function obtener(id) {
  const usuario = await Usuario.findByPk(id);
  if (!usuario) throw AppError.notFound(`Usuario con id ${id} no encontrado`);
  return usuario;
}

const respuesta = async (u) => usuarioResponse(u, await perfilId(u));

/** Filtros opcionales: ?estado=...&rol=... */
async function listar(req, res) {
  const where = {};
  if (req.query.estado) where.estado = req.query.estado;
  if (req.query.rol) where.rol = req.query.rol;
  const usuarios = await Usuario.findAll({ where, order: [['id', 'ASC']] });
  res.json(await Promise.all(usuarios.map(respuesta)));
}

/** Cuentas que esperan la revisión del ADMIN (con código por validar o ya verificadas). */
async function pendientes(req, res) {
  const usuarios = await Usuario.findAll({
    where: { estado: { [Op.in]: ['PENDIENTE_VERIFICACION', 'PENDIENTE_APROBACION'] } },
    order: [['id', 'ASC']]
  });
  res.json(await Promise.all(usuarios.map(respuesta)));
}

/** Personal que ya trabaja en el gimnasio: ADMIN, RECEPCIONISTAS y ENTRENADORES aprobados. */
async function personal(req, res) {
  const usuarios = await Usuario.findAll({
    where: { estado: 'APROBADA', rol: { [Op.in]: ['ADMIN', 'RECEPCIONISTA', 'ENTRENADOR'] } },
    order: [['id', 'ASC']]
  });
  res.json(await Promise.all(usuarios.map(respuesta)));
}

/**
 * El ADMIN agrega un SOCIO, ENTRENADOR o RECEPCIONISTA (máximo 5 recepcionistas).
 * Igual que en el registro, la cuenta queda PENDIENTE_VERIFICACION y se envía el código al correo.
 */
async function crear(req, res) {
  const datos = req.body;
  await validarNuevaCuenta(datos);

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
      rol: datos.rol,
      estado: 'PENDIENTE_VERIFICACION'
    });
    const codigo = nuevoCodigo(usuario);
    await usuario.save({ transaction: t });
    const idPerfil = await crearPerfil(usuario, datos, t);

    await email.enviarCodigoVerificacion(usuario, codigo, MINUTOS());
    await t.commit();
    res.status(201).json(usuarioResponse(usuario, idPerfil));
  } catch (error) {
    if (!t.finished) await t.rollback();
    throw error;
  }
}

async function buscarPorId(req, res) {
  res.json(await respuesta(await obtener(req.params.id)));
}

/** Compara el código que el usuario le dio al ADMIN con el que se envió a su correo. */
async function validarCodigo(usuario, codigo) {
  if (usuario.intentosVerificacion >= MAX_INTENTOS()) {
    throw AppError.badRequest(`Se agotaron los ${MAX_INTENTOS()} intentos para ingresar el código de ${usuario.email}. El usuario debe solicitar un código nuevo en /api/auth/reenviar-codigo`);
  }
  if (!usuario.codigoExpiracion || usuario.codigoExpiracion < new Date()) {
    throw AppError.badRequest(`El código expiró: era válido por ${MINUTOS()} minutos desde que se envió. El usuario debe solicitar uno nuevo en /api/auth/reenviar-codigo`);
  }
  if (usuario.codigoVerificacion !== codigo) {
    usuario.intentosVerificacion += 1;
    await usuario.save();
    const restantes = MAX_INTENTOS() - usuario.intentosVerificacion;
    const detalle = restantes > 0
      ? `Quedan ${restantes} de ${MAX_INTENTOS()} intentos`
      : 'Ya no quedan intentos: el usuario debe solicitar un código nuevo en /api/auth/reenviar-codigo';
    throw AppError.badRequest(`El código ingresado no coincide con el que se envió a ${usuario.email}. Pida al usuario el código del ÚLTIMO correo recibido (si pidió reenviarlo, el anterior ya no sirve). ${detalle}`);
  }
}

/**
 * El usuario le entrega al ADMIN el código que recibió por correo. El ADMIN lo ingresa junto con su decisión.
 * Body: { "codigo": "482913", "decision": 1 } aprueba; { "codigo": "482913", "decision": 2, "motivo": "..." } rechaza.
 * Si el código coincide se guarda la decisión y se envía un correo al usuario con sus datos, su id y el resultado.
 */
async function revisar(req, res) {
  const usuario = await obtener(req.params.id);
  if (usuario.id === req.usuario.id || usuario.rol === 'ADMIN') {
    throw AppError.badRequest('No se puede revisar la cuenta de un administrador');
  }
  if (usuario.estado === 'PENDIENTE_VERIFICACION') {
    await validarCodigo(usuario, req.body.codigo);
    Object.assign(usuario, { codigoVerificacion: null, codigoExpiracion: null, intentosVerificacion: 0, fechaVerificacion: new Date() });
  } else if (usuario.estado !== 'PENDIENTE_APROBACION') {
    // PENDIENTE_APROBACION: cuentas que ya verificaron su correo antes de este cambio
    throw AppError.badRequest(`Solo se revisan cuentas pendientes (estado actual: ${usuario.estado})`);
  }

  if (req.body.decision === DECISION_APROBAR) {
    Object.assign(usuario, { estado: 'APROBADA', motivoRechazo: null, fechaAprobacion: new Date() });
    await usuario.save();
    // La fecha de afiliación / ingreso es la de aprobación
    await Socio.update({ fechaAfiliacion: hoy() }, { where: { usuarioId: usuario.id } });
    await Entrenador.update({ fechaIngreso: hoy() }, { where: { usuarioId: usuario.id } });
  } else {
    Object.assign(usuario, { estado: 'RECHAZADA', motivoRechazo: req.body.motivo || 'Solicitud no aprobada por el administrador' });
    await usuario.save();
  }

  const idPerfil = await perfilId(usuario);
  await email.enviarResultadoRevision(usuario, idPerfil);
  res.json(usuarioResponse(usuario, idPerfil));
}

/** Solo cuentas NO aprobadas (pendientes o rechazadas), junto con su perfil. */
async function eliminar(req, res) {
  const usuario = await obtener(req.params.id);
  if (usuario.estado === 'APROBADA') {
    throw AppError.badRequest('Una cuenta APROBADA no se elimina aquí; elimine el socio o entrenador desde su módulo');
  }
  await Socio.destroy({ where: { usuarioId: usuario.id } });
  await Entrenador.destroy({ where: { usuarioId: usuario.id } });
  await usuario.destroy();
  res.status(204).end();
}

module.exports = { listar, pendientes, personal, crear, buscarPorId, revisar, eliminar };
