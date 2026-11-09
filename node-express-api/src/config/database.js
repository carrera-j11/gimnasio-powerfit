const mysql = require('mysql2/promise');
const { Sequelize } = require('sequelize');

const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD } = process.env;

/**
 * Instancia de Sequelize (ORM): equivale a JPA/Hibernate en Spring.
 * Cada modelo se convierte en una tabla.
 */
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: Number(DB_PORT),
  dialect: 'mysql',
  logging: false,
  timezone: '-05:00', // Ecuador
  dialectOptions: {
    decimalNumbers: true // DECIMAL como número y no como texto
  },
  define: {
    freezeTableName: true,
    underscored: true, // atributos camelCase -> columnas snake_case (socioId -> socio_id)
    timestamps: false
  }
});

/** Crea la base de datos si no existe (como createDatabaseIfNotExist=true en Spring). */
async function crearBaseDeDatos() {
  const conexion = await mysql.createConnection({
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD
  });
  await conexion.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
  await conexion.end();
}

module.exports = { sequelize, crearBaseDeDatos };
