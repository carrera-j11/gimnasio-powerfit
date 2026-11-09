require('dotenv').config();
const bcrypt = require('bcryptjs');
const { crearBaseDeDatos } = require('./config/database');

const PRECIOS_INICIALES = {
  QUINCENAL: { precio: 18, descripcion: 'Acceso libre al gimnasio por 15 días' },
  MENSUAL: { precio: 30, descripcion: 'Acceso libre por 30 días + 1 evaluación física' },
  ANUAL: { precio: 300, descripcion: 'Acceso libre por 1 año + evaluaciones físicas trimestrales' }
};

/** Crea los 3 planes del gimnasio si no existen. */
async function crearPlanes(PlanMembresia, PLANES) {
  for (const [tipo, datos] of Object.entries(PLANES)) {
    if (await PlanMembresia.findOne({ where: { tipo } })) continue;
    await PlanMembresia.create({ tipo, nombre: datos.nombre, duracionDias: datos.dias, ...PRECIOS_INICIALES[tipo] });
    console.log(`>>> Plan creado: ${tipo}`);
  }
}

/** Crea el primer ADMIN (sin él nadie podría aprobar las cuentas). */
async function crearAdministradorInicial(Usuario) {
  const correo = process.env.ADMIN_EMAIL.toLowerCase();
  if (await Usuario.findOne({ where: { email: correo } })) return;
  await Usuario.create({
    cedula: process.env.ADMIN_CEDULA,
    nombres: process.env.ADMIN_NOMBRES,
    apellidos: process.env.ADMIN_APELLIDOS,
    email: correo,
    celular: process.env.ADMIN_CELULAR,
    fechaNacimiento: '1990-01-01',
    password: await bcrypt.hash(process.env.ADMIN_PASSWORD, 10),
    rol: 'ADMIN',
    estado: 'APROBADA',
    fechaVerificacion: new Date(),
    fechaAprobacion: new Date()
  });
  console.log(`>>> Administrador inicial creado: ${correo}`);
}

async function iniciar() {
  try {
    await crearBaseDeDatos();
    // Se cargan después de crear la BD
    const { sequelize, Usuario, PlanMembresia } = require('./models');
    const { PLANES } = require('./models/PlanMembresia');
    const app = require('./app');

    await sequelize.authenticate();
    await sequelize.sync(); // crea las tablas que no existan (como ddl-auto=update)
    console.log(`Conectado a MySQL, base de datos "${process.env.DB_NAME}"`);

    await crearPlanes(PlanMembresia, PLANES);
    await crearAdministradorInicial(Usuario);

    const puerto = Number(process.env.PORT) || 3000;
    app.listen(puerto, () => console.log(`Servidor escuchando en http://localhost:${puerto}`));
  } catch (error) {
    console.error('No se pudo iniciar la aplicación:', error.message);
    process.exit(1);
  }
}

iniciar();
