/**
 * Convierten los modelos en la respuesta JSON (equivalen a los ResponseDTO de Spring).
 * Nunca devuelven la contraseña ni el código de verificación.
 */
const { calcularEdad, horaCorta } = require('./fechas');

const nombreCompleto = (u) => `${u.nombres} ${u.apellidos}`;
const redondear = (n) => Math.round(n * 100) / 100;

const usuarioResponse = (u, perfilId = null) => ({
  id: u.id,
  cedula: u.cedula,
  nombres: u.nombres,
  apellidos: u.apellidos,
  email: u.email,
  celular: u.celular,
  fechaNacimiento: u.fechaNacimiento,
  edad: calcularEdad(u.fechaNacimiento),
  rol: u.rol,
  estado: u.estado,
  perfilId,
  motivoRechazo: u.motivoRechazo,
  fechaRegistro: u.fechaRegistro,
  fechaVerificacion: u.fechaVerificacion,
  fechaAprobacion: u.fechaAprobacion
});

const socioResponse = (s, membresiaVigente) => ({
  id: s.id,
  usuarioId: s.usuario.id,
  cedula: s.usuario.cedula,
  nombres: s.usuario.nombres,
  apellidos: s.usuario.apellidos,
  email: s.usuario.email,
  celular: s.usuario.celular,
  fechaNacimiento: s.usuario.fechaNacimiento,
  edad: calcularEdad(s.usuario.fechaNacimiento),
  objetivo: s.objetivo,
  fechaAfiliacion: s.fechaAfiliacion,
  estadoCuenta: s.usuario.estado,
  membresiaVigente
});

const entrenadorResponse = (e, totalClases) => ({
  id: e.id,
  usuarioId: e.usuario.id,
  nombres: e.usuario.nombres,
  apellidos: e.usuario.apellidos,
  email: e.usuario.email,
  celular: e.usuario.celular,
  especialidad: e.especialidad,
  fechaIngreso: e.fechaIngreso,
  estadoCuenta: e.usuario.estado,
  totalClases
});

const planResponse = (p) => ({
  id: p.id,
  tipo: p.tipo,
  nombre: p.nombre,
  descripcion: p.descripcion,
  precio: p.precio,
  duracionDias: p.duracionDias
});

const membresiaResponse = (m, totalPagado) => ({
  id: m.id,
  socioId: m.socio.id,
  socioNombre: nombreCompleto(m.socio.usuario),
  socioCedula: m.socio.usuario.cedula,
  tipoPlan: m.plan.tipo,
  planNombre: m.plan.nombre,
  precioPlan: m.plan.precio,
  fechaInicio: m.fechaInicio,
  fechaFin: m.fechaFin,
  estado: m.estado,
  totalPagado: redondear(totalPagado),
  saldoPendiente: redondear(m.plan.precio - totalPagado)
});

const pagoResponse = (p) => ({
  id: p.id,
  membresiaId: p.membresia.id,
  socioId: p.membresia.socio.id,
  socioNombre: nombreCompleto(p.membresia.socio.usuario),
  planNombre: p.membresia.plan.nombre,
  monto: p.monto,
  metodoPago: p.metodoPago,
  referencia: p.referencia,
  fechaPago: p.fechaPago
});

const claseResponse = (c, inscritos) => ({
  id: c.id,
  nombre: c.nombre,
  descripcion: c.descripcion,
  diaSemana: c.diaSemana,
  horaInicio: horaCorta(c.horaInicio),
  horaFin: horaCorta(c.horaFin),
  horario: `${c.diaSemana} ${horaCorta(c.horaInicio)} - ${horaCorta(c.horaFin)}`,
  cupoMaximo: c.cupoMaximo,
  inscritos,
  cuposDisponibles: c.cupoMaximo - inscritos,
  entrenadorId: c.entrenador.id,
  entrenadorNombre: nombreCompleto(c.entrenador.usuario),
  especialidad: c.entrenador.especialidad,
  entrenadorEmail: c.entrenador.usuario.email,
  entrenadorCelular: c.entrenador.usuario.celular
});

const inscripcionResponse = (i) => ({
  id: i.id,
  socioId: i.socio.id,
  socioNombre: nombreCompleto(i.socio.usuario),
  socioCedula: i.socio.usuario.cedula,
  claseId: i.clase.id,
  claseNombre: i.clase.nombre,
  entrenadorNombre: nombreCompleto(i.clase.entrenador.usuario),
  horario: `${i.clase.diaSemana} ${horaCorta(i.clase.horaInicio)} - ${horaCorta(i.clase.horaFin)}`,
  fechaInscripcion: i.fechaInscripcion
});

module.exports = {
  nombreCompleto, usuarioResponse, socioResponse, entrenadorResponse, planResponse,
  membresiaResponse, pagoResponse, claseResponse, inscripcionResponse
};
