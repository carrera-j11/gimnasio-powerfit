import { textoDia } from '../utils/formato.js';

/** Tarjeta con los datos de una clase. Las acciones dependen del rol y las decide la página. */
export default function TarjetaClase({ clase, children }) {
  const ocupacion = clase.cupoMaximo > 0 ? Math.round((clase.inscritos / clase.cupoMaximo) * 100) : 0;
  return (
    <article className="tarjeta">
      <p className="tarjeta-antetitulo">{textoDia(clase.diaSemana)} · {clase.horaInicio?.slice(0, 5)} a {clase.horaFin?.slice(0, 5)}</p>
      <h2>{clase.nombre}</h2>
      {clase.descripcion && <p>{clase.descripcion}</p>}
      <p className="tarjeta-dato">Entrenador: {clase.entrenadorNombre}</p>
      <progress max={clase.cupoMaximo} value={clase.inscritos} aria-label={`Cupos ocupados: ${ocupacion} %`} />
      <p className="tarjeta-dato">{clase.cuposDisponibles} de {clase.cupoMaximo} cupos libres</p>
      {children && <div className="fila-acciones">{children}</div>}
    </article>
  );
}
