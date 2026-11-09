/**
 * Reglas compartidas para crear cuentas (registro público o creación por el ADMIN).
 * Cédula, email y celular son ÚNICOS: una persona solo puede tener una cuenta y un rol.
 */
const { Op } = require('sequelize');
const { Usuario, Socio, Entrenador } = require('../models');
const AppError = require('./AppError');
const { calcularEdad, hoy } = require('./fechas');

const MAX_RECEPCIONISTAS = 5;
const EDAD_MINIMA_SOCIO = 15;
const EDAD_MINIMA_PERSONAL = 18;
const EDAD_MAXIMA = 100;

async function validarDatosUnicos({ cedula, email, celular }) {
  const porCedula = await Usuario.findOne({ where: { cedula } });
  if (porCedula) {
    throw AppError.conflict(`La cédula ${cedula} ya está registrada como ${porCedula.rol}. Una persona solo puede tener una cuenta y un rol en el gimnasio`);
  }
  const porEmail = await Usuario.findOne({ where: { email } });
  if (porEmail) throw AppError.conflict(`El email ${email} ya está registrado por otra persona (rol ${porEmail.rol})`);
  const porCelular = await Usuario.findOne({ where: { celular } });
  if (porCelular) throw AppError.conflict(`El celular ${celular} ya está registrado por otra persona (rol ${porCelular.rol})`);
}

/** Rol permitido, especialidad, edad, datos únicos y máximo de recepcionistas. */
async function validarNuevaCuenta({ cedula, email, celular, rol, fechaNacimiento, especialidad }) {
  if (rol === 'ADMIN') {
    throw AppError.badRequest('No se puede crear una cuenta con rol ADMIN. Roles permitidos: SOCIO, ENTRENADOR, RECEPCIONISTA');
  }
  if (rol === 'ENTRENADOR' && (!especialidad || especialidad.trim().length < 3)) {
    throw AppError.badRequest('Para el rol ENTRENADOR debe indicar la especialidad (mínimo 3 caracteres)');
  }
  const edad = calcularEdad(fechaNacimiento);
  const minima = rol === 'SOCIO' ? EDAD_MINIMA_SOCIO : EDAD_MINIMA_PERSONAL;
  if (edad < minima) throw AppError.badRequest(`Para el rol ${rol} la edad mínima es ${minima} años (tiene ${edad})`);
  if (edad > EDAD_MAXIMA) throw AppError.badRequest(`La fecha de nacimiento no es válida (edad mayor a ${EDAD_MAXIMA} años)`);

  await validarDatosUnicos({ cedula, email, celular });

  if (rol === 'RECEPCIONISTA') {
    const actuales = await Usuario.count({ where: { rol: 'RECEPCIONISTA', estado: { [Op.ne]: 'RECHAZADA' } } });
    if (actuales >= MAX_RECEPCIONISTAS) {
      throw AppError.badRequest(`El gimnasio ya tiene el máximo de ${MAX_RECEPCIONISTAS} recepcionistas (aprobadas o pendientes). Rechace o elimine una antes de agregar otra`);
    }
  }
}

/** Al editar datos: el celular no puede pertenecer a otra persona. */
async function validarCelularDisponible(celular, usuarioId) {
  if (await Usuario.count({ where: { celular, id: { [Op.ne]: usuarioId } } })) {
    throw AppError.conflict(`El celular ${celular} ya está registrado por otra persona`);
  }
}

/** Crea el perfil según el rol. Devuelve su id (null para RECEPCIONISTA). */
async function crearPerfil(usuario, { especialidad, objetivo }, transaction) {
  if (usuario.rol === 'SOCIO') {
    return (await Socio.create({ usuarioId: usuario.id, objetivo: objetivo || null, fechaAfiliacion: hoy() }, { transaction })).id;
  }
  if (usuario.rol === 'ENTRENADOR') {
    return (await Entrenador.create({ usuarioId: usuario.id, especialidad: especialidad.trim(), fechaIngreso: hoy() }, { transaction })).id;
  }
  return null;
}

module.exports = { MAX_RECEPCIONISTAS, validarNuevaCuenta, validarCelularDisponible, crearPerfil };
