import { Link } from 'react-router-dom';

export default function NoEncontrada() {
  return (
    <div className="estado">
      <h1>Página no encontrada</h1>
      <p>La dirección que abriste no existe.</p>
      <Link to="/">Volver al inicio</Link>
    </div>
  );
}
