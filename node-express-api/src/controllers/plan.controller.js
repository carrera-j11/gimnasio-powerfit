const { PlanMembresia } = require('../models');
const AppError = require('../utils/AppError');
const { planResponse } = require('../utils/mappers');

/** Solo 3 planes fijos: no se crean ni se eliminan. */
async function obtenerPlanPorTipo(tipo) {
  const plan = await PlanMembresia.findOne({ where: { tipo } });
  if (!plan) throw AppError.notFound(`No existe el plan ${tipo}`);
  return plan;
}

async function listar(req, res) {
  const planes = await PlanMembresia.findAll({ order: [['duracionDias', 'ASC']] });
  res.json(planes.map(planResponse));
}

async function buscar(req, res) {
  res.json(planResponse(await obtenerPlanPorTipo(req.params.tipo)));
}

/** Solo ADMIN: cambia el precio y la descripción. */
async function actualizar(req, res) {
  const plan = await obtenerPlanPorTipo(req.params.tipo);
  await plan.update({ precio: req.body.precio, descripcion: req.body.descripcion || null });
  res.json(planResponse(plan));
}

module.exports = { obtenerPlanPorTipo, listar, buscar, actualizar };
