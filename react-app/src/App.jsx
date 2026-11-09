import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import RutaProtegida from './components/RutaProtegida.jsx';
import Clases from './pages/Clases.jsx';
import Entrenadores from './pages/Entrenadores.jsx';
import Inicio from './pages/Inicio.jsx';
import Inscripciones from './pages/Inscripciones.jsx';
import Login from './pages/Login.jsx';
import Membresias from './pages/Membresias.jsx';
import NoEncontrada from './pages/NoEncontrada.jsx';
import Pagos from './pages/Pagos.jsx';
import Planes from './pages/Planes.jsx';
import Socios from './pages/Socios.jsx';

const PERSONAL = ['ADMIN', 'RECEPCIONISTA'];
const CON_SOCIO = [...PERSONAL, 'SOCIO'];

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <RutaProtegida>
            <Layout />
          </RutaProtegida>
        }
      >
        <Route index element={<Inicio />} />
        <Route path="planes" element={<Planes />} />
        <Route path="clases" element={<Clases />} />
        <Route path="entrenadores" element={<Entrenadores />} />
        <Route path="socios" element={<RutaProtegida roles={PERSONAL}><Socios /></RutaProtegida>} />
        <Route path="membresias" element={<RutaProtegida roles={CON_SOCIO}><Membresias /></RutaProtegida>} />
        <Route path="pagos" element={<RutaProtegida roles={CON_SOCIO}><Pagos /></RutaProtegida>} />
        <Route path="inscripciones" element={<RutaProtegida roles={CON_SOCIO}><Inscripciones /></RutaProtegida>} />
        <Route path="inicio" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NoEncontrada />} />
      </Route>
    </Routes>
  );
}
