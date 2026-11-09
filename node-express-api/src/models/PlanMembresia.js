const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// El gimnasio maneja SOLO estos tres planes, con duración fija
const PLANES = {
  QUINCENAL: { nombre: 'Plan Quincenal', dias: 15 },
  MENSUAL: { nombre: 'Plan Mensual', dias: 30 },
  ANUAL: { nombre: 'Plan Anual', dias: 365 }
};
const TIPOS_PLAN = Object.keys(PLANES);

const PlanMembresia = sequelize.define('PlanMembresia', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tipo: { type: DataTypes.ENUM(...TIPOS_PLAN), allowNull: false, unique: true },
  nombre: { type: DataTypes.STRING(30), allowNull: false },
  descripcion: { type: DataTypes.STRING(255) },
  precio: { type: DataTypes.DECIMAL(7, 2), allowNull: false },
  duracionDias: { type: DataTypes.INTEGER, allowNull: false }
}, { tableName: 'planes_membresia' });

module.exports = { PlanMembresia, PLANES, TIPOS_PLAN };
