const AppError = require('../utils/AppError');

const NOMBRES_HTTP = {
  400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found',
  405: 'Method Not Allowed', 409: 'Conflict', 415: 'Unsupported Media Type',
  500: 'Internal Server Error', 503: 'Service Unavailable'
};

function respuesta(req, status, mensaje, errores) {
  const body = {
    timestamp: new Date().toISOString(),
    status,
    error: NOMBRES_HTTP[status] || 'Error',
    mensaje,
    ruta: req.originalUrl
  };
  if (errores) body.errores = errores;
  return body;
}

/** 404 para rutas que no existen. */
function rutaNoEncontrada(req, res) {
  res.status(404).json(respuesta(req, 404, `La ruta ${req.method} ${req.originalUrl} no existe`));
}

/**
 * MIDDLEWARE GLOBAL DE ERRORES (equivale al @RestControllerAdvice de Spring).
 * Express lo reconoce porque recibe 4 parámetros (err, req, res, next).
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Errores controlados por nosotros
  if (err instanceof AppError) {
    return res.status(err.status).json(respuesta(req, err.status, err.message, err.errores));
  }

  // JSON mal escrito (lo lanza express.json())
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json(respuesta(req, 400, 'El JSON está mal escrito. Revise comas, comillas y llaves'));
  }

  // Restricciones de la base de datos
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json(respuesta(req, 409, 'Ya existe un registro con esos datos (valor duplicado)'));
  }
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(409).json(respuesta(req, 409,
      'La operación viola una relación de la base de datos (registro relacionado inexistente o en uso)'));
  }

  // Cualquier otro error inesperado
  console.error('Error inesperado:', err);
  return res.status(500).json(respuesta(req, 500, 'Ocurrió un error interno en el servidor'));
}

module.exports = { errorHandler, rutaNoEncontrada };
