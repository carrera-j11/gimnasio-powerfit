/** Título de cada página con espacio para sus acciones, como "Nueva clase". */
export default function Cabecera({ titulo, descripcion, children }) {
  return (
    <header className="cabecera">
      <div>
        <h1>{titulo}</h1>
        {descripcion && <p>{descripcion}</p>}
      </div>
      {children && <div className="cabecera-acciones">{children}</div>}
    </header>
  );
}
