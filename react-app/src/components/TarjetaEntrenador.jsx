import { fecha, nombreCompleto } from '../utils/formato.js';

export default function TarjetaEntrenador({ entrenador, children }) {
  return (
    <article className="tarjeta">
      <p className="tarjeta-antetitulo">{entrenador.especialidad}</p>
      <h2>{nombreCompleto(entrenador)}</h2>
      <p className="tarjeta-dato">{entrenador.email}</p>
      <p className="tarjeta-dato">Celular: {entrenador.celular}</p>
      <p className="tarjeta-dato">Ingreso: {fecha(entrenador.fechaIngreso)}</p>
      <p className="tarjeta-dato">Clases a cargo: {entrenador.totalClases}</p>
      {children && <div className="fila-acciones">{children}</div>}
    </article>
  );
}
