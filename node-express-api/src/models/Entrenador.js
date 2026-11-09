const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/** Perfil de entrenador. Usuario 1 --- 1 Entrenador; Entrenador 1 --- N Clase. */
const Entrenador = sequelize.define('Entrenador', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  especialidad: { type: DataTypes.STRING(60), allowNull: false },
  fechaIngreso: { type: DataTypes.DATEONLY, allowNull: false }
}, { tableName: 'entrenadores' });

module.exports = Entrenador;
