import { useState } from 'react';
import { sociosApi } from '../api/servicios.js';
import Cabecera from '../components/Cabecera.jsx';
import ConfirmarAccion from '../components/ConfirmarAccion.jsx';
import { EstadoConsulta, SinRegistros } from '../components/Estados.jsx';
import Etiqueta from '../components/Etiqueta.jsx';
import ModalFormulario from '../components/ModalFormulario.jsx';
import TablaDatos from '../components/TablaDatos.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useAvisos } from '../context/AvisosContext.jsx';
import { useConsulta } from '../hooks/useConsulta.js';
import { fecha, nombreCompleto } from '../utils/formato.js';

const CAMPOS = [
  { nombre: 'nombres', etiqueta: 'Nombres', requerido: true, maxLength: 50 },
  { nombre: 'apellidos', etiqueta: 'Apellidos', requerido: true, maxLength: 50 },
  { nombre: 'celular', etiqueta: 'Celular', tipo: 'tel', requerido: true, ayuda: 'Ejemplo: 0991234567' },
  { nombre: 'objetivo', etiqueta: 'Objetivo', tipo: 'textarea', maxLength: 150 },
];

const COLUMNAS = [
  { titulo: 'Socio', valor: (s) => nombreCompleto(s) },
  { titulo: 'Cédula', valor: (s) => s.cedula },
  { titulo: 'Email', valor: (s) => s.email },
  { titulo: 'Celular', valor: (s) => s.celular },
  { titulo: 'Afiliación', valor: (s) => fecha(s.fechaAfiliacion) },
  { titulo: 'Membresía', valor: (s) => (s.membresiaVigente ? <Etiqueta valor="ACTIVA" /> : <Etiqueta texto="Sin membresía" />) },
];

export default function Socios() {
  const { rol } = useAuth();
  const avisar = useAvisos();
  const socios = useConsulta(sociosApi.listar);
  const [busqueda, setBusqueda] = useState('');
  const [editando, setEditando] = useState(null);
  const [eliminando, setEliminando] = useState(null);

  const guardar = async (datos) => {
    await sociosApi.editar(editando.id, datos);
    avisar('Socio actualizado');
    setEditando(null);
    socios.recargar();
  };

  const eliminar = async () => {
    await sociosApi.eliminar(eliminando.id);
    avisar('Socio eliminado');
    setEliminando(null);
    socios.recargar();
  };

  const coincide = (s) =>
    `${nombreCompleto(s)} ${s.cedula} ${s.email}`.toLowerCase().includes(busqueda.trim().toLowerCase());

  return (
    <>
      <Cabecera titulo="Socios" descripcion="Los socios se registran y verifican desde su cuenta; aquí se consultan y editan." />
      <EstadoConsulta consulta={socios} textoVacio="Todavía no hay socios registrados.">
        {(datos) => {
          const filas = datos.filter(coincide);
          return (
            <>
              <div className="filtros">
                <label htmlFor="buscar-socio">Buscar</label>
                <input
                  id="buscar-socio"
                  type="search"
                  placeholder="Nombre, cédula o email"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>
              {filas.length === 0 ? (
                <SinRegistros texto="Ningún socio coincide con la búsqueda." />
              ) : (
                <TablaDatos
                  etiqueta="Lista de socios"
                  columnas={COLUMNAS}
                  filas={filas}
                  acciones={(s) => (
                    <>
                      <button type="button" className="boton" onClick={() => setEditando(s)}>Editar</button>
                      {rol === 'ADMIN' && (
                        <button type="button" className="boton boton-texto-peligro" onClick={() => setEliminando(s)}>Eliminar</button>
                      )}
                    </>
                  )}
                />
              )}
              <p className="total">{filas.length} de {datos.length} socios</p>
            </>
          );
        }}
      </EstadoConsulta>

      {editando && (
        <ModalFormulario
          titulo="Editar socio"
          campos={CAMPOS}
          valoresIniciales={editando}
          onGuardar={guardar}
          onCerrar={() => setEditando(null)}
        />
      )}
      {eliminando && (
        <ConfirmarAccion
          titulo="Eliminar socio"
          mensaje={`¿Seguro que quieres eliminar a ${nombreCompleto(eliminando)}?`}
          onConfirmar={eliminar}
          onCerrar={() => setEliminando(null)}
        />
      )}
    </>
  );
}
