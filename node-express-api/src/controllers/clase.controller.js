const { Clase, Inscripcion, Entrenador, Usuario, INC } = require('../models');
const AppError = require('../utils/AppError');
const { aMinutos, horaCorta } = require('../utils/fechas');
const { claseResponse, inscripcionResponse } = require('../utils/mappers');
const { obtenerEntrenadorDeUsuario } = require('./entrenador.controller');
const { DIAS_SEMANA } = require('../models/Clase');

// Horario de atención del gimnasio y duración permitida de una clase
const APERTURA = '06:00';
const CIERRE = '22:00';
const DURACION_MINIMA = 30;
const DURACION_MAXIMA = 180;

const INCLUIR = [INC.entrenador];

const porHorario = (a, b) =>
  DIAS_SEMANA.indexOf(a.diaSemana) - DIAS_SEMANA.indexOf(b.diaSemana) || aMinutos(a.horaInicio) - aMinutos(b.horaInicio);

const respuesta = async (c) => claseResponse(c, await Inscripcion.count({ where: { claseId: c.id } }));

async function obtenerClase(id) {
  const clase = await Clase.findByPk(id, { include: INCLUIR });
  if (!clase) throw AppError.notFound(`Clase con id ${id} no encontrada`);
  return clase;
}

/** El ADMIN debe indicar qué entrenador (con cuenta APROBADA) dicta la clase. */
async function entrenadorEncargado(entrenadorId) {
  if (!entrenadorId) {
    throw AppError.badRequest('Debe indicar el entrenador encargado de la clase (entrenadorId). Cada clase tiene siempre un entrenador');
  }
  const entrenador = await Entrenador.findByPk(entrenadorId, { include: [{ model: Usuario, as: 'usuario' }] });
  if (!entrenador) throw AppError.notFound(`Entrenador con id ${entrenadorId} no encontrado`);
  if (entrenador.usuario.estado !== 'APROBADA') {
    throw AppError.badRequest(`El entrenador ${entrenador.usuario.nombres} ${entrenador.usuario.apellidos} no tiene la cuenta aprobada (estado: ${entrenador.usuario.estado})`);
  }
  return entrenador;
}

/** Un ENTRENADOR solo opera sobre las clases que él creó. */
function validarDueno(clase, usuario, accion) {
  if (usuario.rol === 'ENTRENADOR' && clase.entrenador.usuario.id !== usuario.id) {
    throw AppError.forbidden(`Solo puede ${accion} las clases que usted creó`);
  }
}

/**
 * 1) Fin posterior al inicio; 2) dentro del horario del gimnasio (06:00 - 22:00);
 * 3) duración entre 30 y 180 minutos; 4) el entrenador no puede tener clases cruzadas.
 */
async function validarHorario({ horaInicio, horaFin, diaSemana }, entrenadorId, idActual = null) {
  const inicio = aMinutos(horaInicio);
  const fin = aMinutos(horaFin);
  if (fin <= inicio) throw AppError.badRequest('La hora de fin debe ser posterior a la hora de inicio');
  if (inicio < aMinutos(APERTURA) || fin > aMinutos(CIERRE)) {
    throw AppError.badRequest(`La clase debe estar dentro del horario del gimnasio (${APERTURA} a ${CIERRE})`);
  }
  const duracion = fin - inicio;
  if (duracion < DURACION_MINIMA || duracion > DURACION_MAXIMA) {
    throw AppError.badRequest(`La clase debe durar entre ${DURACION_MINIMA} y ${DURACION_MAXIMA} minutos (duración actual: ${duracion})`);
  }
  const delDia = await Clase.findAll({ where: { entrenadorId, diaSemana } });
  for (const otra of delDia) {
    if (otra.id === idActual) continue;
    if (inicio < aMinutos(otra.horaFin) && fin > aMinutos(otra.horaInicio)) {
      throw AppError.badRequest(`Ya tiene la clase '${otra.nombre}' el ${otra.diaSemana} de ${horaCorta(otra.horaInicio)} a ${horaCorta(otra.horaFin)}`);
    }
  }
}

const campos = ({ nombre, descripcion, diaSemana, horaInicio, horaFin, cupoMaximo }) =>
  ({ nombre, descripcion: descripcion || null, diaSemana, horaInicio, horaFin, cupoMaximo });

async function listar(req, res) {
  const clases = (await Clase.findAll({ include: INCLUIR })).sort(porHorario);
  res.json(await Promise.all(clases.map(respuesta)));
}

/** El ENTRENADOR consulta sus clases. */
async function mias(req, res) {
  const entrenador = await obtenerEntrenadorDeUsuario(req.usuario);
  const clases = (await Clase.findAll({ where: { entrenadorId: entrenador.id }, include: INCLUIR })).sort(porHorario);
  res.json(await Promise.all(clases.map(respuesta)));
}

async function buscarPorId(req, res) {
  res.json(await respuesta(await obtenerClase(req.params.id)));
}

async function inscritos(req, res) {
  const clase = await obtenerClase(req.params.id);
  validarDueno(clase, req.usuario, 'ver los inscritos de');
  const lista = await Inscripcion.findAll({ where: { claseId: clase.id }, include: [INC.socio, INC.clase], order: [['id', 'ASC']] });
  res.json(lista.map(inscripcionResponse));
}

/** ADMIN: indica el entrenador (entrenadorId). ENTRENADOR: la clase queda a su nombre. */
async function crear(req, res) {
  const entrenador = req.usuario.rol === 'ENTRENADOR'
    ? await obtenerEntrenadorDeUsuario(req.usuario)
    : await entrenadorEncargado(req.body.entrenadorId);
  const datos = campos(req.body);
  await validarHorario(datos, entrenador.id);
  const clase = await Clase.create({ ...datos, entrenadorId: entrenador.id });
  res.status(201).json(await respuesta(await obtenerClase(clase.id)));
}

async function actualizar(req, res) {
  const clase = await obtenerClase(req.params.id);
  validarDueno(clase, req.usuario, 'modificar');
  const datos = campos(req.body);
  // El ADMIN puede cambiar el entrenador encargado; un ENTRENADOR no
  datos.entrenadorId = req.usuario.rol !== 'ENTRENADOR' && req.body.entrenadorId
    ? (await entrenadorEncargado(req.body.entrenadorId)).id
    : clase.entrenadorId;
  await validarHorario(datos, datos.entrenadorId, clase.id);
  const inscritosActuales = await Inscripcion.count({ where: { claseId: clase.id } });
  if (datos.cupoMaximo < inscritosActuales) {
    throw AppError.badRequest(`El cupo no puede ser menor a los ${inscritosActuales} socios ya inscritos`);
  }
  await clase.update(datos);
  res.json(await respuesta(await obtenerClase(clase.id)));
}

/** El entrenador dueño o un ADMIN; solo si no tiene inscritos. */
async function eliminar(req, res) {
  const clase = await obtenerClase(req.params.id);
  validarDueno(clase, req.usuario, 'eliminar');
  if (await Inscripcion.count({ where: { claseId: clase.id } })) {
    throw AppError.badRequest('No se puede eliminar la clase porque tiene socios inscritos');
  }
  await clase.destroy();
  res.status(204).end();
}

module.exports = { obtenerClase, listar, mias, buscarPorId, inscritos, crear, actualizar, eliminar };
