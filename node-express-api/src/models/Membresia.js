const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ESTADOS_MEMBRESIA = ['ACTIVA', 'VENCIDA', 'CANCELADA'];

const Membresia = sequelize.define('Membresia', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  fechaInicio: { type: DataTypes.DATEONLY, allowNull: false },
  fechaFin: { type: DataTypes.DATEONLY, allowNull: false },
  estado: { type: DataTypes.ENUM(...ESTADOS_MEMBRESIA), allowNull: false, defaultValue: 'ACTIVA' }
}, { tableName: 'membresias' });

module.exports = { Membresia, ESTADOS_MEMBRESIA };
