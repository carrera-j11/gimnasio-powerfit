const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DIAS_SEMANA = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];

/** Clase creada por un entrenador, con un número máximo de participantes. */
const Clase = sequelize.define('Clase', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(50), allowNull: false },
  descripcion: { type: DataTypes.STRING(255) },
  diaSemana: { type: DataTypes.ENUM(...DIAS_SEMANA), allowNull: false },
  horaInicio: { type: DataTypes.TIME, allowNull: false },
  horaFin: { type: DataTypes.TIME, allowNull: false },
  cupoMaximo: { type: DataTypes.INTEGER, allowNull: false }
}, { tableName: 'clases' });

module.exports = { Clase, DIAS_SEMANA };
