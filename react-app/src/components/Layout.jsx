import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Menu from './Menu.jsx';

/** Estructura común de las páginas: menú a un lado y contenido al otro. */
export default function Layout() {
  const { pathname } = useLocation();
  const principal = useRef(null);
  const primeraCarga = useRef(true);

  // Al cambiar de página, el foco pasa al contenido nuevo
  useEffect(() => {
    if (primeraCarga.current) {
      primeraCarga.current = false;
      return;
    }
    principal.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="estructura">
      <a className="saltar" href="#contenido">Saltar al contenido</a>
      <Menu />
      <main id="contenido" className="contenido" tabIndex={-1} ref={principal}>
        <Outlet />
      </main>
    </div>
  );
}
