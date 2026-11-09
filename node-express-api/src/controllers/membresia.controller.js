const { Op } = require('sequelize');
const { Membresia, Pago, INC } = require('../models');
const AppError = require('../utils/AppError');
const { hoy, sumarDias } = require('../utils/fechas');
const { membresiaResponse } = require('../utils/mappers');
const { obtenerSocio, obtenerSocioDeUsuario, validarSocioActivo } = require('./socio.controller');
const { obtenerPlanPorTipo } = require('./plan.controller');

const INCLUIR = [INC.socio, INC.plan];
const MAX_DIAS_ANTICIPACION = 30;

/** Si la fecha de fin ya pasó, la membresía pasa a VENCIDA automáticamente. */
async function actualizarSiVencio(m) {
  if (m.estado === 'ACTIVA' && m.fechaFin < hoy()) {
    m.estado = 'VENCIDA';
    await m.save();
  }
  return m;
}

async function totalPagado(membresiaId) {
  return Number(await Pago.sum('monto', { where: { membresiaId } })) || 0;
}

const respuesta = async (m) => membresiaResponse(m, await totalPagado(m.id));

async function responderLista(res, where) {
  const lista = await Membresia.findAll({ where, include: INCLUIR, order: [['id', 'DESC']] });
  for (const m of lista) await actualizarSiVencio(m);
  res.json(await Promise.all(lista.map(respuesta)));
}

async function obtenerMembresia(id) {
  const m = await Membresia.findByPk(id, { include: INCLUIR });
  if (!m) throw AppError.notFound(`Membresía con id ${id} no encontrada`);
  return actualizarSiVencio(m);
}

function validarFechaInicio(inicio) {
  if (inicio < hoy()) throw AppError.badRequest('La fecha de inicio no puede ser anterior a hoy');
  if (inicio > sumarDias(hoy(), MAX_DIAS_ANTICIPACION)) {
    throw AppError.badRequest(`La fecha de inicio no puede ser más de ${MAX_DIAS_ANTICIPACION} días en el futuro`);
  }
}

async function listar(req, res) {
  await responderLista(res, {});
}

async function listarPorSocio(req, res) {
  await obtenerSocio(req.params.socioId);
  await responderLista(res, { socioId: req.params.socioId });
}

/** El SOCIO consulta sus propias membresías. */
async function mias(req, res) {
  const socio = await obtenerSocioDeUsuario(req.usuario);
  await responderLista(res, { socioId: socio.id });
}

async function buscarPorId(req, res) {
  const m = await obtenerMembresia(req.params.id);
  if (req.usuario.rol === 'SOCIO' && m.socio.usuario.id !== req.usuario.id) {
    throw AppError.forbidden('Un socio solo puede ver sus propias membresías');
  }
  res.json(await respuesta(m));
}

async function crear(req, res) {
  const socio = await obtenerSocio(req.body.socioId);
  validarSocioActivo(socio);
  const plan = await obtenerPlanPorTipo(req.body.tipoPlan);

  const inicio = req.body.fechaInicio || hoy();
  validarFechaInicio(inicio);
  const activa = await Membresia.count({ where: { socioId: socio.id, estado: 'ACTIVA', fechaFin: { [Op.gte]: inicio } } });
  if (activa) {
    throw AppError.badRequest(`El socio ${socio.usuario.nombres} ${socio.usuario.apellidos} ya tiene una membresía activa en esa fecha`);
  }

  const nueva = await Membresia.create({
    socioId: socio.id, planId: plan.id, fechaInicio: inicio,
    fechaFin: sumarDias(inicio, plan.duracionDias), estado: 'ACTIVA'
  });
  res.status(201).json(await respuesta(await obtenerMembresia(nueva.id)));
}

/** Cambia el plan o la fecha de inicio (se recalcula la fecha de fin). */
async function actualizar(req, res) {
  const m = await obtenerMembresia(req.params.id);
  if (m.estado !== 'ACTIVA') {
    throw AppError.badRequest(`Solo se pueden modificar membresías ACTIVAS (estado actual: ${m.estado})`);
  }
  const plan = await obtenerPlanPorTipo(req.body.tipoPlan);
  if (plan.id !== m.planId && (await Pago.count({ where: { membresiaId: m.id } }))) {
    throw AppError.badRequest('No se puede cambiar el plan porque la membresía ya tiene pagos registrados');
  }
  const inicio = req.body.fechaInicio || m.fechaInicio;
  if (inicio !== m.fechaInicio) validarFechaInicio(inicio);
  await m.update({ planId: plan.id, fechaInicio: inicio, fechaFin: sumarDias(inicio, plan.duracionDias) });
  res.json(await respuesta(await obtenerMembresia(m.id)));
}

async function cancelar(req, res) {
  const m = await obtenerMembresia(req.params.id);
  if (m.estado === 'CANCELADA') throw AppError.badRequest('La membresía ya se encuentra cancelada');
  await m.update({ estado: 'CANCELADA' });
  res.json(await respuesta(m));
}

async function eliminar(req, res) {
  const m = await obtenerMembresia(req.params.id);
  if (await Pago.count({ where: { membresiaId: m.id } })) {
    throw AppError.badRequest('No se puede eliminar la membresía porque tiene pagos registrados. Puede cancelarla en su lugar');
  }
  await m.destroy();
  res.status(204).end();
}

module.exports = {
  obtenerMembresia, totalPagado,
  listar, listarPorSocio, mias, buscarPorId, crear, actualizar, cancelar, eliminar
};
