import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { etiqueta, nombreCompleto } from '../utils/formato.js';

const TODOS = ['ADMIN', 'RECEPCIONISTA', 'ENTRENADOR', 'SOCIO'];
const CON_SOCIO = ['ADMIN', 'RECEPCIONISTA', 'SOCIO'];

// Cada opción se muestra solo a los roles que pueden usarla en la API
const OPCIONES = [
  { ruta: '/', texto: 'Inicio', roles: TODOS },
  { ruta: '/socios', texto: 'Socios', roles: ['ADMIN', 'RECEPCIONISTA'] },
  { ruta: '/clases', texto: 'Clases', roles: TODOS },
  { ruta: '/entrenadores', texto: 'Entrenadores', roles: TODOS },
  { ruta: '/planes', texto: 'Planes', roles: TODOS },
  { ruta: '/membresias', texto: 'Membresías', roles: CON_SOCIO },
  { ruta: '/pagos', texto: 'Pagos', roles: CON_SOCIO },
  { ruta: '/inscripciones', texto: 'Inscripciones', roles: CON_SOCIO },
];

export default function Menu() {
  const { usuario, rol, cerrarSesion } = useAuth();
  const [abierto, setAbierto] = useState(false);

  return (
    <aside className="lateral">
      <div className="lateral-cabecera">
        <span className="marca">PowerFit</span>
        <button
          type="button"
          className="boton-menu"
          aria-expanded={abierto}
          aria-controls="menu-principal"
          onClick={() => setAbierto(!abierto)}
        >
          {abierto ? 'Cerrar' : 'Menú'}
        </button>
      </div>

      <div id="menu-principal" className={abierto ? 'lateral-cuerpo abierto' : 'lateral-cuerpo'}>
        <p className="usuario">
          <strong>{nombreCompleto(usuario)}</strong>
          <span>{rol === 'ADMIN' ? 'Administrador' : etiqueta(rol)}</span>
        </p>
        <nav aria-label="Secciones">
          {OPCIONES.filter((o) => o.roles.includes(rol)).map((o) => (
            <NavLink key={o.ruta} to={o.ruta} end={o.ruta === '/'} onClick={() => setAbierto(false)}>
              {o.texto}
            </NavLink>
          ))}
        </nav>
        <button type="button" className="boton-salir" onClick={cerrarSesion}>Cerrar sesión</button>
      </div>
    </aside>
  );
}
