const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ROLES = ['ADMIN', 'RECEPCIONISTA', 'ENTRENADOR', 'SOCIO'];
// Roles que una persona puede solicitar al registrarse (ADMIN no)
const ROLES_SOLICITABLES = ['SOCIO', 'ENTRENADOR', 'RECEPCIONISTA'];
// PENDIENTE_VERIFICACION -> PENDIENTE_APROBACION -> APROBADA | RECHAZADA
const ESTADOS_CUENTA = ['PENDIENTE_VERIFICACION', 'PENDIENTE_APROBACION', 'APROBADA', 'RECHAZADA'];

/** Cuenta de acceso con los datos personales. Se relaciona 1:1 con Socio o Entrenador. */
const Usuario = sequelize.define('Usuario', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  cedula: { type: DataTypes.STRING(10), allowNull: false, unique: true },
  nombres: { type: DataTypes.STRING(50), allowNull: false },
  apellidos: { type: DataTypes.STRING(50), allowNull: false },
  email: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  celular: { type: DataTypes.STRING(10), allowNull: false, unique: true }, // cédula, email y celular únicos
  fechaNacimiento: { type: DataTypes.DATEONLY, allowNull: false },
  password: { type: DataTypes.STRING(100), allowNull: false }, // cifrada con bcrypt
  rol: { type: DataTypes.ENUM(...ROLES), allowNull: false },
  estado: { type: DataTypes.ENUM(...ESTADOS_CUENTA), allowNull: false, defaultValue: 'PENDIENTE_VERIFICACION' },
  codigoVerificacion: { type: DataTypes.STRING(6) },
  codigoExpiracion: { type: DataTypes.DATE },
  intentosVerificacion: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  motivoRechazo: { type: DataTypes.STRING(255) },
  fechaRegistro: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  fechaVerificacion: { type: DataTypes.DATE },
  fechaAprobacion: { type: DataTypes.DATE }
}, { tableName: 'usuarios' });

module.exports = { Usuario, ROLES, ROLES_SOLICITABLES, ESTADOS_CUENTA };
