// Componentes para los estados de una consulta: cargando, sin registros y error.

export function Cargando({ texto = 'Cargando información…' }) {
  return (
    <div className="estado" role="status">
      <span className="spinner" aria-hidden="true" /> {texto}
    </div>
  );
}

export function SinRegistros({ texto = 'No existen registros.' }) {
  return <div className="estado">{texto}</div>;
}

export function MensajeError({ texto, onReintentar }) {
  return (
    <div className="estado estado-error" role="alert">
      <p><strong>No se pudo cargar la información.</strong></p>
      <p>{texto}</p>
      {onReintentar && (
        <button type="button" className="boton" onClick={onReintentar}>Reintentar</button>
      )}
    </div>
  );
}

/**
 * Recibe el resultado de useConsulta y decide qué mostrar.
 * Solo muestra children(datos) cuando la información está disponible.
 */
export function EstadoConsulta({ consulta, textoVacio, children }) {
  const { datos, cargando, error, recargar } = consulta;
  if (error) return <MensajeError texto={error} onReintentar={recargar} />;
  if (cargando && datos === null) return <Cargando />;
  if (Array.isArray(datos) && datos.length === 0) return <SinRegistros texto={textoVacio} />;
  return children(datos);
}
