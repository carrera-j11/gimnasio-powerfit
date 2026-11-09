import { useState } from 'react';
import { entrenadoresApi } from '../api/servicios.js';
import Cabecera from '../components/Cabecera.jsx';
import ConfirmarAccion from '../components/ConfirmarAccion.jsx';
import { EstadoConsulta } from '../components/Estados.jsx';
import ModalFormulario from '../components/ModalFormulario.jsx';
import TarjetaEntrenador from '../components/TarjetaEntrenador.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useAvisos } from '../context/AvisosContext.jsx';
import { useConsulta } from '../hooks/useConsulta.js';
import { nombreCompleto } from '../utils/formato.js';

const CAMPOS = [
  { nombre: 'nombres', etiqueta: 'Nombres', requerido: true, maxLength: 50 },
  { nombre: 'apellidos', etiqueta: 'Apellidos', requerido: true, maxLength: 50 },
  { nombre: 'celular', etiqueta: 'Celular', tipo: 'tel', requerido: true, ayuda: 'Ejemplo: 0991234567' },
  { nombre: 'especialidad', etiqueta: 'Especialidad', requerido: true, maxLength: 60 },
];

export default function Entrenadores() {
  const { usuario, rol } = useAuth();
  const avisar = useAvisos();
  const entrenadores = useConsulta(entrenadoresApi.listar);
  const [editando, setEditando] = useState(null);
  const [eliminando, setEliminando] = useState(null);

  // La API permite editar al ADMIN y a cada entrenador sobre su propio perfil
  const puedeEditar = (e) => rol === 'ADMIN' || (rol === 'ENTRENADOR' && e.id === usuario.perfilId);

  const guardar = async (datos) => {
    await entrenadoresApi.editar(editando.id, datos);
    avisar('Entrenador actualizado');
    setEditando(null);
    entrenadores.recargar();
  };

  const eliminar = async () => {
    await entrenadoresApi.eliminar(eliminando.id);
    avisar('Entrenador eliminado');
    setEliminando(null);
    entrenadores.recargar();
  };

  return (
    <>
      <Cabecera titulo="Entrenadores" />
      <EstadoConsulta consulta={entrenadores} textoVacio="Todavía no hay entrenadores registrados.">
        {(datos) => (
          <div className="rejilla">
            {datos.map((e) => (
              <TarjetaEntrenador key={e.id} entrenador={e}>
                {puedeEditar(e) && (
                  <button type="button" className="boton" onClick={() => setEditando(e)}>Editar</button>
                )}
                {rol === 'ADMIN' && (
                  <button type="button" className="boton boton-texto-peligro" onClick={() => setEliminando(e)}>Eliminar</button>
                )}
              </TarjetaEntrenador>
            ))}
          </div>
        )}
      </EstadoConsulta>

      {editando && (
        <ModalFormulario
          titulo="Editar entrenador"
          campos={CAMPOS}
          valoresIniciales={editando}
          onGuardar={guardar}
          onCerrar={() => setEditando(null)}
        />
      )}
      {eliminando && (
        <ConfirmarAccion
          titulo="Eliminar entrenador"
          mensaje={`¿Seguro que quieres eliminar a ${nombreCompleto(eliminando)}?`}
          onConfirmar={eliminar}
          onCerrar={() => setEliminando(null)}
        />
      )}
    </>
  );
}
