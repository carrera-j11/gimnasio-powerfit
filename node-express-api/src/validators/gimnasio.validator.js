const { body, param } = require('express-validator');
const { idBody, fecha, hora, opcionLista, textoOpcional, dinero, entero } = require('./comunes');
const { TIPOS_PLAN } = require('../models/PlanMembresia');
const { METODOS_PAGO } = require('../models/Pago');
const { DIAS_SEMANA } = require('../models/Clase');

const tipoParam = param('tipo').isIn(TIPOS_PLAN)
  .withMessage((v) => `El plan '${v}' no existe. Planes disponibles: [${TIPOS_PLAN.join(', ')}]`);

// El tipo y la duración son fijos: solo se cambian precio y descripción
const planUpdate = [
  textoOpcional('descripcion', 255, 'La descripción'),
  dinero('precio', 'El precio', 1, 1000)
];

const membresiaCrear = [
  idBody('socioId', 'del socio'),
  opcionLista('tipoPlan', 'El plan', TIPOS_PLAN),
  fecha('fechaInicio', 'La fecha de inicio', { opcional: true })
];

const membresiaActualizar = [
  opcionLista('tipoPlan', 'El plan', TIPOS_PLAN),
  fecha('fechaInicio', 'La fecha de inicio', { opcional: true })
];

const pago = [
  idBody('membresiaId', 'de la membresía'),
  dinero('monto', 'El monto', 0.01, 9999.99),
  opcionLista('metodoPago', 'El método de pago', METODOS_PAGO),
  textoOpcional('referencia', 50, 'La referencia')
];

// ADMIN envía entrenadorId; un ENTRENADOR no (la clase queda a su nombre)
const clase = [
  body('nombre')
    .exists({ values: 'falsy' }).withMessage('El nombre de la clase es obligatorio').bail()
    .isString().withMessage('El nombre debe ser texto').bail().trim()
    .isLength({ min: 3, max: 50 }).withMessage('El nombre debe tener entre 3 y 50 caracteres'),
  textoOpcional('descripcion', 255, 'La descripción'),
  opcionLista('diaSemana', 'El día de la semana', DIAS_SEMANA),
  hora('horaInicio', 'La hora de inicio'),
  hora('horaFin', 'La hora de fin'),
  entero('cupoMaximo', 'El número máximo de participantes es obligatorio', 1, 30,
    'El número máximo de participantes debe estar entre 1 y 30'),
  idBody('entrenadorId', 'del entrenador', { opcional: true })
];

// SOCIO solo envía claseId; ADMIN y RECEPCIONISTA también socioId
const inscripcion = [
  idBody('claseId', 'de la clase'),
  idBody('socioId', 'del socio', { opcional: true })
];

module.exports = { tipoParam, planUpdate, membresiaCrear, membresiaActualizar, pago, clase, inscripcion };
