const { body } = require('express-validator');
const { textoLetras, celular, textoOpcional } = require('./comunes');

// La cédula y el email no se modifican
const socioUpdate = [
  textoLetras('nombres', 'Los nombres'),
  textoLetras('apellidos', 'Los apellidos'),
  celular(),
  textoOpcional('objetivo', 150, 'El objetivo')
];

const entrenadorUpdate = [
  textoLetras('nombres', 'Los nombres'),
  textoLetras('apellidos', 'Los apellidos'),
  celular(),
  body('especialidad')
    .exists({ values: 'falsy' }).withMessage('La especialidad es obligatoria').bail()
    .isString().withMessage('La especialidad debe ser texto').bail().trim()
    .isLength({ min: 3, max: 60 }).withMessage('La especialidad debe tener entre 3 y 60 caracteres')
];

module.exports = { socioUpdate, entrenadorUpdate };
