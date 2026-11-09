import { etiqueta } from '../utils/formato.js';

const COLORES = { ACTIVA: 'ok', APROBADA: 'ok', VENCIDA: 'alerta', CANCELADA: 'peligro', RECHAZADA: 'peligro' };

/** Muestra un estado como texto dentro de una pastilla de color. */
export default function Etiqueta({ valor, texto }) {
  return <span className={`etiqueta etiqueta-${COLORES[valor] ?? 'neutra'}`}>{texto ?? etiqueta(valor)}</span>;
}
