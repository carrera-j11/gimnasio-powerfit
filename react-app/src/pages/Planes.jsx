import { useState } from 'react';
import { planesApi } from '../api/servicios.js';
import Cabecera from '../components/Cabecera.jsx';
import { EstadoConsulta } from '../components/Estados.jsx';
import ModalFormulario from '../components/ModalFormulario.jsx';
import TarjetaPlan from '../components/TarjetaPlan.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useAvisos } from '../context/AvisosContext.jsx';
import { useConsulta } from '../hooks/useConsulta.js';

const CAMPOS = [
  { nombre: 'precio', etiqueta: 'Precio (USD)', tipo: 'number', requerido: true, numerico: true, min: 1, max: 1000, step: '0.01' },
  { nombre: 'descripcion', etiqueta: 'Descripción', tipo: 'textarea', maxLength: 255 },
];

export default function Planes() {
  const { rol } = useAuth();
  const avisar = useAvisos();
  const planes = useConsulta(planesApi.listar);
  const [editando, setEditando] = useState(null);

  const guardar = async (datos) => {
    await planesApi.editar(editando.tipo, datos);
    avisar('Plan actualizado');
    setEditando(null);
    planes.recargar();
  };

  return (
    <>
      <Cabecera titulo="Planes" descripcion="El tipo y la duración de cada plan son fijos." />
      <EstadoConsulta consulta={planes} textoVacio="No existen planes registrados.">
        {(datos) => (
          <div className="rejilla">
            {datos.map((plan) => (
              <TarjetaPlan key={plan.id} plan={plan}>
                {rol === 'ADMIN' && (
                  <button type="button" className="boton" onClick={() => setEditando(plan)}>Editar</button>
                )}
              </TarjetaPlan>
            ))}
          </div>
        )}
      </EstadoConsulta>

      {editando && (
        <ModalFormulario
          titulo={`Editar ${editando.nombre}`}
          campos={CAMPOS}
          valoresIniciales={{ precio: editando.precio, descripcion: editando.descripcion }}
          onGuardar={guardar}
          onCerrar={() => setEditando(null)}
        />
      )}
    </>
  );
}
