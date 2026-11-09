const express = require('express');
const cors = require('cors');
const jsonRequerido = require('./middlewares/jsonRequerido');
const { errorHandler, rutaNoEncontrada } = require('./middlewares/errorHandler');

const app = express();

// ----- Middlewares globales -----
// CORS: permite que los frontends (React y Angular) consuman la API desde el navegador
app.use(cors({
  origin: (process.env.CORS_ORIGENES || 'http://localhost:5173,http://localhost:4200').split(','),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Authorization', 'Content-Type']
}));
app.use(jsonRequerido);   // 415 si el cuerpo no es JSON
app.use(express.json());  // convierte el cuerpo JSON en req.body

app.get('/', (req, res) => res.json({ mensaje: 'API Gimnasio PowerFit (Node.js + Express) funcionando' }));

// ----- Rutas -----
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/planes', require('./routes/plan.routes'));
app.use('/api/socios', require('./routes/socio.routes'));
app.use('/api/entrenadores', require('./routes/entrenador.routes'));
app.use('/api/membresias', require('./routes/membresia.routes'));
app.use('/api/pagos', require('./routes/pago.routes'));
app.use('/api/clases', require('./routes/clase.routes'));
app.use('/api/inscripciones', require('./routes/inscripcion.routes'));

// ----- Manejo de errores (siempre al final) -----
app.use(rutaNoEncontrada);
app.use(errorHandler);

module.exports = app;
