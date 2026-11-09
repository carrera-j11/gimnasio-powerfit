const DIAS = {
  LUNES: 'Lunes', MARTES: 'Martes', MIERCOLES: 'Miércoles', JUEVES: 'Jueves',
  VIERNES: 'Viernes', SABADO: 'Sábado', DOMINGO: 'Domingo',
};

export const OPCIONES_DIA = Object.entries(DIAS).map(([valor, texto]) => ({ valor, texto }));

export const OPCIONES_METODO = [
  { valor: 'EFECTIVO', texto: 'Efectivo' },
  { valor: 'TARJETA', texto: 'Tarjeta' },
  { valor: 'TRANSFERENCIA', texto: 'Transferencia' },
];

export const textoDia = (dia) => DIAS[dia] ?? dia;

/** Convierte valores de la API como PENDIENTE_APROBACION en "Pendiente aprobacion". */
export function etiqueta(valor) {
  if (!valor) return '';
  const texto = String(valor).replaceAll('_', ' ').toLowerCase();
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export const dinero = (valor) =>
  new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(Number(valor ?? 0));

/** Las fechas de la API llegan como 2026-11-06 o 2026-11-06T14:30:00. */
export function fecha(valor) {
  if (!valor) return '';
  const [anio, mes, dia] = String(valor).slice(0, 10).split('-');
  return `${dia}/${mes}/${anio}`;
}

export const nombreCompleto = (persona) => `${persona.nombres} ${persona.apellidos}`;
