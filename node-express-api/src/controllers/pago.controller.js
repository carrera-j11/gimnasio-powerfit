const { Pago, INC } = require('../models');
const AppError = require('../utils/AppError');
const { pagoResponse } = require('../utils/mappers');
const { obtenerMembresia, totalPagado } = require('./membresia.controller');
const { obtenerSocioDeUsuario } = require('./socio.controller');

const INCLUIR = [INC.membresia];
const redondear = (n) => Math.round(n * 100) / 100;

async function obtenerPago(id) {
  const pago = await Pago.findByPk(id, { include: INCLUIR });
  if (!pago) throw AppError.notFound(`Pago con id ${id} no encontrado`);
  return pago;
}

function validarReferencia({ metodoPago, referencia }) {
  if (metodoPago === 'TRANSFERENCIA' && (!referencia || !referencia.trim())) {
    throw AppError.badRequest('Para pagos por TRANSFERENCIA el número de referencia es obligatorio');
  }
}

function validarMonto(monto, saldo) {
  if (saldo <= 0) throw AppError.badRequest('La membresía ya está pagada en su totalidad');
  if (monto > saldo) throw AppError.badRequest(`El monto $${monto} supera el saldo pendiente de $${redondear(saldo)}`);
}

async function listar(req, res) {
  const pagos = await Pago.findAll({ include: INCLUIR, order: [['id', 'DESC']] });
  res.json(pagos.map(pagoResponse));
}

async function listarPorMembresia(req, res) {
  await obtenerMembresia(req.params.membresiaId);
  const pagos = await Pago.findAll({ where: { membresiaId: req.params.membresiaId }, include: INCLUIR, order: [['id', 'DESC']] });
  res.json(pagos.map(pagoResponse));
}

/** El SOCIO consulta sus propios pagos. */
async function mios(req, res) {
  const socio = await obtenerSocioDeUsuario(req.usuario);
  const pagos = await Pago.findAll({
    include: [{ ...INC.membresia, where: { socioId: socio.id } }], order: [['id', 'DESC']]
  });
  res.json(pagos.map(pagoResponse));
}

async function buscarPorId(req, res) {
  const pago = await obtenerPago(req.params.id);
  if (req.usuario.rol === 'SOCIO' && pago.membresia.socio.usuario.id !== req.usuario.id) {
    throw AppError.forbidden('Un socio solo puede ver sus propios pagos');
  }
  res.json(pagoResponse(pago));
}

async function crear(req, res) {
  const membresia = await obtenerMembresia(req.body.membresiaId);
  if (membresia.estado === 'CANCELADA') {
    throw AppError.badRequest('No se pueden registrar pagos en una membresía cancelada');
  }
  validarReferencia(req.body);
  validarMonto(req.body.monto, membresia.plan.precio - (await totalPagado(membresia.id)));

  const pago = await Pago.create({
    membresiaId: membresia.id,
    monto: req.body.monto,
    metodoPago: req.body.metodoPago,
    referencia: req.body.referencia || null
  });
  res.status(201).json(pagoResponse(await obtenerPago(pago.id)));
}

async function actualizar(req, res) {
  const pago = await obtenerPago(req.params.id);
  if (pago.membresiaId !== req.body.membresiaId) {
    throw AppError.badRequest('No se puede cambiar la membresía de un pago ya registrado');
  }
  validarReferencia(req.body);
  // Saldo sin contar el monto anterior de este mismo pago
  const saldo = pago.membresia.plan.precio - (await totalPagado(pago.membresiaId)) + pago.monto;
  validarMonto(req.body.monto, saldo);

  await pago.update({ monto: req.body.monto, metodoPago: req.body.metodoPago, referencia: req.body.referencia || null });
  res.json(pagoResponse(await obtenerPago(pago.id)));
}

async function eliminar(req, res) {
  const pago = await obtenerPago(req.params.id);
  await pago.destroy();
  res.status(204).end();
}

module.exports = { listar, listarPorMembresia, mios, buscarPorId, crear, actualizar, eliminar };
