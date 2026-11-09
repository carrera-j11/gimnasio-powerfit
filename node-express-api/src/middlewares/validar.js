const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

/**
 * Revisa el resultado de las reglas de express-validator.
 * Si hay errores responde 400 con un mensaje por cada campo (como @Valid en Spring).
 */
function validar(req, res, next) {
  const resultado = validationResult(req);
  if (resultado.isEmpty()) return next();

  const errores = {};
  for (const error of resultado.array()) {
    const campo = error.path;
    if (!errores[campo]) errores[campo] = error.msg; // solo el primer error de cada campo
  }
  throw AppError.badRequest('Hay errores de validación en los datos enviados', errores);
}

module.exports = validar;
