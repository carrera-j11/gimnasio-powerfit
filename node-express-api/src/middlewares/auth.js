const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');
const AppError = require('../utils/AppError');

/**
 * MIDDLEWARE DE AUTENTICACIÓN (equivale al JwtAuthenticationFilter de Spring).
 * 1) Lee "Authorization: Bearer <token>".
 * 2) Verifica la firma y la expiración del token.
 * 3) Busca al usuario y comprueba que su cuenta siga APROBADA.
 * 4) Guarda el usuario en req.usuario para los siguientes middlewares y controladores.
 */
async function verificarToken(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw AppError.unauthorized('Debe iniciar sesión. Envíe el token en el encabezado Authorization: Bearer <token>');
  }

  const token = header.substring(7);
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw AppError.unauthorized('El token ha expirado, inicie sesión nuevamente');
    }
    throw AppError.unauthorized('El token no es válido (fue alterado o está mal formado)');
  }

  const usuario = await Usuario.findByPk(payload.id);
  if (!usuario) {
    throw AppError.unauthorized('El usuario del token ya no existe');
  }
  if (usuario.estado !== 'APROBADA') {
    throw AppError.unauthorized(`La cuenta ya no está aprobada (estado: ${usuario.estado})`);
  }

  req.usuario = usuario; // el rol se toma de la BD por si el ADMIN lo cambió
  next();
}

/**
 * MIDDLEWARE DE AUTORIZACIÓN POR ROLES.
 * Uso: router.delete('/:id', permitirRoles('ADMIN'), controlador)
 */
function permitirRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.usuario.rol)) {
      throw AppError.forbidden(
        `No tiene permisos para realizar esta acción. Su rol es: ${req.usuario.rol}. Roles permitidos: ${roles.join(', ')}`
      );
    }
    next();
  };
}

module.exports = { verificarToken, permitirRoles };
