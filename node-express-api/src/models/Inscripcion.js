const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Tabla intermedia de la relación N:M entre Socio y Clase
const Inscripcion = sequelize.define('Inscripcion', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  fechaInscripcion: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
}, {
  tableName: 'inscripciones',
  indexes: [{ unique: true, fields: ['socio_id', 'clase_id'] }]
});

module.exports = Inscripcion;
