import { dinero } from '../utils/formato.js';

export default function TarjetaPlan({ plan, children }) {
  return (
    <article className="tarjeta">
      <p className="tarjeta-antetitulo">{plan.duracionDias} días</p>
      <h2>{plan.nombre}</h2>
      <p className="tarjeta-precio">{dinero(plan.precio)}</p>
      {plan.descripcion && <p>{plan.descripcion}</p>}
      {children && <div className="fila-acciones">{children}</div>}
    </article>
  );
}
