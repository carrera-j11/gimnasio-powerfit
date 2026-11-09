const { body, query } = require('express-validator');
const { cedula, textoLetras, email, celular, fecha, opcionLista, textoOpcional, erroresPassword, errorCodigo, conMensaje } = require('./comunes');
const { ROLES, ROLES_SOLICITABLES, ESTADOS_CUENTA } = require('../models/Usuario');

const registro = [
  cedula(),
  textoLetras('nombres', 'Los nombres'),
  textoLetras('apellidos', 'Los apellidos'),
  email(),
  celular(),
  fecha('fechaNacimiento', 'La fecha de nacimiento', { momento: 'pasada' }),
  body('password')
    .exists({ values: 'falsy' }).withMessage('La contraseña es obligatoria').bail()
    .isString().withMessage('La contraseña debe ser texto').bail()
    .custom(conMensaje(erroresPassword)),
  body('confirmarPassword')
    .exists({ values: 'falsy' }).withMessage('Debe confirmar la contraseña'),
  opcionLista('rolSolicitado', 'El rol solicitado', ROLES_SOLICITABLES),
  textoOpcional('especialidad', 60, 'La especialidad'),
  textoOpcional('objetivo', 150, 'El objetivo')
];

// El ADMIN agrega un SOCIO, ENTRENADOR o RECEPCIONISTA (sin confirmarPassword)
const usuarioCrear = [
  cedula(),
  textoLetras('nombres', 'Los nombres'),
  textoLetras('apellidos', 'Los apellidos'),
  email(),
  celular(),
  fecha('fechaNacimiento', 'La fecha de nacimiento', { momento: 'pasada' }),
  body('password')
    .exists({ values: 'falsy' }).withMessage('La contraseña es obligatoria').bail()
    .isString().withMessage('La contraseña debe ser texto').bail()
    .custom(conMensaje(erroresPassword)),
  opcionLista('rol', 'El rol', ROLES_SOLICITABLES),
  textoOpcional('especialidad', 60, 'La especialidad'),
  textoOpcional('objetivo', 150, 'El objetivo')
];

const soloEmail = [email()];

const login = [
  body('email').exists({ values: 'falsy' }).withMessage('El email es obligatorio').bail()
    .isString().withMessage('El email debe ser texto').bail().trim().toLowerCase(),
  body('password').exists({ values: 'falsy' }).withMessage('La contraseña es obligatoria')
];

// codigo = el que el usuario recibió por correo y le entregó al ADMIN; decision: 1 = aprobar, 2 = rechazar (motivo opcional)
const revision = [
  body('codigo')
    .exists({ values: 'falsy' }).withMessage('El código de verificación es obligatorio: es el código de 6 dígitos que le llegó al usuario por correo').bail()
    .isString().withMessage('El código debe enviarse como texto, entre comillas (ej. "482913")').bail()
    .trim()
    .custom(conMensaje(errorCodigo)),
  body('decision')
    .exists({ values: 'null' }).withMessage('La decisión es obligatoria: 1 = aprobar, 2 = rechazar').bail()
    .isInt({ min: 1, max: 2 }).withMessage('La decisión solo puede ser 1 (aprobar) o 2 (rechazar)')
    .toInt(),
  textoOpcional('motivo', 255, 'El motivo')
];

const filtros = [
  query('estado').optional().isIn(ESTADOS_CUENTA)
    .withMessage((v) => `El estado '${v}' no es válido. Valores permitidos: [${ESTADOS_CUENTA.join(', ')}]`),
  query('rol').optional().isIn(ROLES)
    .withMessage((v) => `El rol '${v}' no es válido. Valores permitidos: [${ROLES.join(', ')}]`)
];

module.exports = { registro, usuarioCrear, soloEmail, login, revision, filtros };
