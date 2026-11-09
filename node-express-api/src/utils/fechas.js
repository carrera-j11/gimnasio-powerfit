/** Utilidades de fechas trabajando con texto 'YYYY-MM-DD' (como LocalDate en Java). */

function hoy() {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().substring(0, 10);
}

function sumarDias(fecha, dias) {
  const d = new Date(`${fecha}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().substring(0, 10);
}

function calcularEdad(fechaNacimiento) {
  const [a, m, d] = fechaNacimiento.split('-').map(Number);
  const [ha, hm, hd] = hoy().split('-').map(Number);
  let edad = ha - a;
  if (hm < m || (hm === m && hd < d)) edad--;
  return edad;
}

/** '07:00' o '07:00:00' -> minutos desde medianoche, para comparar horarios. */
function aMinutos(hora) {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

/** '07:00:00' -> '07:00' */
function horaCorta(hora) {
  return hora ? hora.substring(0, 5) : hora;
}

module.exports = { hoy, sumarDias, calcularEdad, aMinutos, horaCorta };
