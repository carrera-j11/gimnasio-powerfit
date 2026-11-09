const AppError = require('../utils/AppError');

/** Si la petición trae cuerpo, debe ser JSON (si no, 415). */
function jsonRequerido(req, res, next) {
  const tieneCuerpo = Number(req.headers['content-length'] || 0) > 0 || req.headers['transfer-encoding'];
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && tieneCuerpo && !req.is('application/json')) {
    return next(new AppError(415,
      `Los datos deben enviarse en formato JSON (Content-Type: application/json). Se recibió: ${req.headers['content-type'] || 'desconocido'}`));
  }
  next();
}

module.exports = jsonRequerido;
