/**
 * Tabla reutilizable. columnas = [{ titulo, valor: (fila) => contenido }].
 * acciones es opcional y devuelve los botones de cada fila.
 */
export default function TablaDatos({ columnas, filas, acciones, etiqueta }) {
  return (
    <div className="tabla-contenedor" tabIndex={0} role="region" aria-label={etiqueta}>
      <table className="tabla">
        <thead>
          <tr>
            {columnas.map((c) => (
              <th key={c.titulo} scope="col">{c.titulo}</th>
            ))}
            {acciones && <th scope="col">Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => (
            <tr key={fila.id}>
              {columnas.map((c) => (
                <td key={c.titulo}>{c.valor(fila)}</td>
              ))}
              {acciones && <td><div className="fila-acciones">{acciones(fila)}</div></td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
