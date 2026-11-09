const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const METODOS_PAGO = ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA'];

const Pago = sequelize.define('Pago', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  monto: { type: DataTypes.DECIMAL(7, 2), allowNull: false },
  metodoPago: { type: DataTypes.ENUM(...METODOS_PAGO), allowNull: false },
  referencia: { type: DataTypes.STRING(50) },
  fechaPago: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
}, { tableName: 'pagos' });

module.exports = { Pago, METODOS_PAGO };
