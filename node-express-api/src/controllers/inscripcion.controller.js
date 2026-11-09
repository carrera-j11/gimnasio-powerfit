const { Inscripcion, Clase, INC } = require('../models');
const AppError = require('../utils/AppError');
const { aMinutos, horaCorta } = require('../utils/fechas');
const { inscripcionResponse } = require('../utils/mappers');
const { obtenerSocio, obtenerSocioDeUsuario, validarSocioActivo, tieneMembresiaVigente } = require('./socio.controller');
const { obtenerClase } = require('./clase.controller');

const INCLUIR = [INC.socio, INC.clase];

async function obtenerInscripcion(id) {
  const inscripcion = await Inscripcion.findByPk(id, { include: INCLUIR });
  if (!inscripcion) throw AppError.notFound(`Inscripción con id ${id} no encontrada`);
  return inscripcion;
}

async function listar(req, res) {
  const lista = await Inscripcion.findAll({ include: INCLUIR, order: [['id', 'DESC']] });
  res.json(lista.map(inscripcionResponse));
}

async function mias(req, res) {
  const socio = await obtenerSocioDeUsuario(req.usuario);
  const lista = await Inscripcion.findAll({ where: { socioId: socio.id }, include: INCLUIR, order: [['id', 'DESC']] });
  res.json(lista.map(inscripcionResponse));
}

/** SOCIO: se inscribe a sí mismo. ADMIN / RECEPCIONISTA: deben enviar socioId. */
async function crear(req, res) {
  let socio;
  if (req.usuario.rol === 'SOCIO') {
    socio = await obtenerSocioDeUsuario(req.usuario);
  } else {
    if (!req.body.socioId) throw AppError.badRequest('Debe indicar el id del socio (socioId) que se va a inscribir');
    socio = await obtenerSocio(req.body.socioId);
  }
  validarSocioActivo(socio);
  const clase = await obtenerClase(req.body.claseId);

  if (await Inscripcion.count({ where: { socioId: socio.id, claseId: clase.id } })) {
    throw AppError.conflict(`El socio ya está inscrito en la clase '${clase.nombre}'`);
  }
  if (!(await tieneMembresiaVigente(socio.id))) {
    throw AppError.badRequest('El socio no tiene una membresía activa y vigente. No puede inscribirse en clases');
  }
  if ((await Inscripcion.count({ where: { claseId: clase.id } })) >= clase.cupoMaximo) {
    throw AppError.badRequest(`La clase '${clase.nombre}' ya alcanzó su máximo de ${clase.cupoMaximo} participantes`);
  }
  // El socio no puede estar en dos clases al mismo tiempo
  const delDia = await Inscripcion.findAll({
    where: { socioId: socio.id },
    include: [{ model: Clase, as: 'clase', where: { diaSemana: clase.diaSemana } }]
  });
  for (const otra of delDia) {
    const c = otra.clase;
    if (aMinutos(clase.horaInicio) < aMinutos(c.horaFin) && aMinutos(clase.horaFin) > aMinutos(c.horaInicio)) {
      throw AppError.badRequest(`El socio ya está inscrito en '${c.nombre}' el ${c.diaSemana} de ${horaCorta(c.horaInicio)} a ${horaCorta(c.horaFin)}, que se cruza con esta clase`);
    }
  }

  const inscripcion = await Inscripcion.create({ socioId: socio.id, claseId: clase.id });
  res.status(201).json(inscripcionResponse(await obtenerInscripcion(inscripcion.id)));
}

/** Cancelar: el propio SOCIO, ADMIN o RECEPCIONISTA. Libera el cupo. */
async function eliminar(req, res) {
  const inscripcion = await obtenerInscripcion(req.params.id);
  if (req.usuario.rol === 'SOCIO' && inscripcion.socio.usuario.id !== req.usuario.id) {
    throw AppError.forbidden('Un socio solo puede cancelar sus propias inscripciones');
  }
  await inscripcion.destroy();
  res.status(204).end();
}

module.exports = { listar, mias, crear, eliminar };
