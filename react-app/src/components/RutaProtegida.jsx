import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/** Sin sesión lleva al login. Con roles, solo deja pasar a los usuarios indicados. */
export default function RutaProtegida({ roles, children }) {
  const { usuario, rol } = useAuth();
  const ubicacion = useLocation();

  if (!usuario) return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />;
  if (roles && !roles.includes(rol)) return <Navigate to="/" replace />;
  return children;
}
