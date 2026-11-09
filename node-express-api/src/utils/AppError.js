/**
 * Error controlado de la aplicación. Lleva el código HTTP y el mensaje
 * que verá el cliente. El middleware errorHandler lo convierte en JSON.
 */
class AppError extends Error {
  constructor(status, mensaje, errores = null) {
    super(mensaje);
    this.status = status;
    this.errores = errores;
  }

  static badRequest(mensaje, errores) { return new AppError(400, mensaje, errores); }
  static unauthorized(mensaje) { return new AppError(401, mensaje); }
  static forbidden(mensaje) { return new AppError(403, mensaje); }
  static notFound(mensaje) { return new AppError(404, mensaje); }
  static conflict(mensaje) { return new AppError(409, mensaje); }
}

module.exports = AppError;
