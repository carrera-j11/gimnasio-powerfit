const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/** Perfil de socio. Usuario 1 --- 1 Socio (usuarioId se agrega en models/index.js). */
const Socio = sequelize.define('Socio', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  objetivo: { type: DataTypes.STRING(150) },
  fechaAfiliacion: { type: DataTypes.DATEONLY, allowNull: false }
}, { tableName: 'socios' });

module.exports = Socio;
