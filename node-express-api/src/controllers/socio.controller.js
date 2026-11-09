const { Op } = require('sequelize');
const { Socio, Usuario, Membresia, Inscripcion } = require('../models');
const AppError = require('../utils/AppError');
const { validarCelularDisponible } = require('../utils/cuentas');
const { hoy } = require('../utils/fechas');
const { socioResponse } = require('../utils/mappers');

const INCLUIR = [{ model: Usuario, as: 'usuario' }];

async function tieneMembresiaVigente(socioId) {
  const fecha = hoy();
  const cantidad = await Membresia.count({
    where: { socioId, estado: 'ACTIVA', fechaInicio: { [Op.lte]: fecha }, fechaFin: { [Op.gte]: fecha } }
  });
  return cantidad > 0;
}

const respuesta = async (s) => socioResponse(s, await tieneMembresiaVigente(s.id));

async function obtenerSocio(id) {
  const socio = await Socio.findByPk(id, { include: INCLUIR });
  if (!socio) throw AppError.notFound(`Socio con id ${id} no encontrado`);
  return socio;
}

async function obtenerSocioDeUsuario(usuario) {
  const socio = await Socio.findOne({ where: { usuarioId: usuario.id }, include: INCLUIR });
  if (!socio) throw AppError.notFound('El usuario actual no tiene un perfil de socio');
  return socio;
}

/** El socio debe tener la cuenta aprobada para operar. */
function validarSocioActivo(socio) {
  if (socio.usuario.estado !== 'APROBADA') {
    throw AppError.badRequest(`La cuenta del socio ${socio.usuario.nombres} ${socio.usuario.apellidos} no está aprobada (estado: ${socio.usuario.estado})`);
  }
}

function validarAcceso(socio, actual) {
  if (actual.rol === 'SOCIO' && socio.usuario.id !== actual.id) {
    throw AppError.forbidden('Un socio solo puede ver y editar sus propios datos');
  }
}

/** Solo socios con cuenta APROBADA (los pendientes se revisan en /api/admin/usuarios). */
async function listar(req, res) {
  const socios = await Socio.findAll({
    include: [{ model: Usuario, as: 'usuario', where: { estado: 'APROBADA' } }], order: [['id', 'ASC']]
  });
  res.json(await Promise.all(socios.map(respuesta)));
}

async function miPerfil(req, res) {
  res.json(await respuesta(await obtenerSocioDeUsuario(req.usuario)));
}

async function buscarPorId(req, res) {
  const socio = await obtenerSocio(req.params.id);
  validarAcceso(socio, req.usuario);
  res.json(await respuesta(socio));
}

async function buscarPorCedula(req, res) {
  const socio = await Socio.findOne({ include: [{ model: Usuario, as: 'usuario', where: { cedula: req.params.cedula } }] });
  if (!socio) throw AppError.notFound(`No existe un socio con la cédula ${req.params.cedula}`);
  res.json(await respuesta(socio));
}

/** ADMIN y RECEPCIONISTA editan cualquiera; un SOCIO solo sus datos. */
async function actualizar(req, res) {
  const socio = await obtenerSocio(req.params.id);
  validarAcceso(socio, req.usuario);
  const { nombres, apellidos, celular, objetivo } = req.body;
  await validarCelularDisponible(celular, socio.usuario.id);
  await socio.usuario.update({ nombres, apellidos, celular });
  await socio.update({ objetivo: objetivo || null });
  res.json(await respuesta(socio));
}

/** Elimina el socio y su cuenta, solo si no tiene membresías ni inscripciones. */
async function eliminar(req, res) {
  const socio = await obtenerSocio(req.params.id);
  const membresias = await Membresia.count({ where: { socioId: socio.id } });
  const inscripciones = await Inscripcion.count({ where: { socioId: socio.id } });
  if (membresias || inscripciones) {
    throw AppError.badRequest('No se puede eliminar el socio porque tiene membresías o inscripciones registradas');
  }
  const usuario = socio.usuario;
  await socio.destroy();
  await usuario.destroy();
  res.status(204).end();
}

module.exports = {
  tieneMembresiaVigente, obtenerSocio, obtenerSocioDeUsuario, validarSocioActivo,
  listar, miPerfil, buscarPorId, buscarPorCedula, actualizar, eliminar
};
