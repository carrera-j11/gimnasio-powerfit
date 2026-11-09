import { useState } from 'react';
import { membresiasApi, planesApi, sociosApi } from '../api/servicios.js';
import Cabecera from '../components/Cabecera.jsx';
import ConfirmarAccion from '../components/ConfirmarAccion.jsx';
import { EstadoConsulta } from '../components/Estados.jsx';
import Etiqueta from '../components/Etiqueta.jsx';
import ModalFormulario from '../components/ModalFormulario.jsx';
import TablaDatos from '../components/TablaDatos.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useAvisos } from '../context/AvisosContext.jsx';
import { useConsulta } from '../hooks/useConsulta.js';
import { dinero, fecha, nombreCompleto } from '../utils/formato.js';

export default function Membresias() {
  const { rol } = useAuth();
  const avisar = useAvisos();
  const esSocio = rol === 'SOCIO';
  const membresias = useConsulta(esSocio ? membresiasApi.mias : membresiasApi.listar);
  const planes = useConsulta(planesApi.listar);
  const socios = useConsulta(() => (esSocio ? Promise.resolve([]) : sociosApi.listar()));
  const [formulario, setFormulario] = useState(null); // null, { nueva: true } o la membresía a editar
  const [cancelando, setCancelando] = useState(null);
  const [eliminando, setEliminando] = useState(null);

  const opcionesPlan = (planes.datos ?? []).map((p) => ({ valor: p.tipo, texto: `${p.nombre} (${dinero(p.precio)})` }));
  const campoPlan = { nombre: 'tipoPlan', etiqueta: 'Plan', tipo: 'select', requerido: true, opciones: opcionesPlan };
  const campoInicio = { nombre: 'fechaInicio', etiqueta: 'Fecha de inicio', tipo: 'date', ayuda: 'Si la dejas vacía, empieza hoy.' };
  const campoSocio = {
    nombre: 'socioId',
    etiqueta: 'Socio',
    tipo: 'select',
    requerido: true,
    numerico: true,
    opciones: (socios.datos ?? []).map((s) => ({ valor: s.id, texto: `${nombreCompleto(s)} (${s.cedula})` })),
  };
  const campos = formulario?.nueva && !esSocio ? [campoSocio, campoPlan, campoInicio] : [campoPlan, campoInicio];

  const guardar = async (datos) => {
    if (!formulario.nueva) await membresiasApi.editar(formulario.id, datos);
    else if (esSocio) await membresiasApi.contratar(datos);
    else await membresiasApi.crear(datos);
    avisar(formulario.nueva ? 'Membresía registrada' : 'Membresía actualizada');
    setFormulario(null);
    membresias.recargar();
  };

  const cancelar = async () => {
    await membresiasApi.cancelar(cancelando.id);
    avisar('Membresía cancelada');
    setCancelando(null);
    membresias.recargar();
  };

  const eliminar = async () => {
    await membresiasApi.eliminar(eliminando.id);
    avisar('Membresía eliminada');
    setEliminando(null);
    membresias.recargar();
  };

  const columnas = [
    ...(esSocio ? [] : [{ titulo: 'Socio', valor: (m) => m.socioNombre }]),
    { titulo: 'Plan', valor: (m) => m.planNombre },
    { titulo: 'Inicio', valor: (m) => fecha(m.fechaInicio) },
    { titulo: 'Fin', valor: (m) => fecha(m.fechaFin) },
    { titulo: 'Estado', valor: (m) => <Etiqueta valor={m.estado} /> },
    { titulo: 'Pagado', valor: (m) => dinero(m.totalPagado) },
    { titulo: 'Saldo', valor: (m) => dinero(m.saldoPendiente) },
  ];

  return (
    <>
      <Cabecera titulo={esSocio ? 'Mis membresías' : 'Membresías'}>
        <button type="button" className="boton boton-principal" onClick={() => setFormulario({ nueva: true })}>
          {esSocio ? 'Contratar plan' : 'Nueva membresía'}
        </button>
      </Cabecera>

      <EstadoConsulta consulta={membresias} textoVacio="No existen membresías registradas.">
        {(datos) => (
          <TablaDatos
            etiqueta="Lista de membresías"
            columnas={columnas}
            filas={datos}
            acciones={
              esSocio
                ? undefined
                : (m) => (
                    <>
                      {m.estado === 'ACTIVA' && (
                        <>
                          <button type="button" className="boton" onClick={() => setFormulario(m)}>Editar</button>
                          <button type="button" className="boton" onClick={() => setCancelando(m)}>Cancelar</button>
                        </>
                      )}
                      {rol === 'ADMIN' && (
                        <button type="button" className="boton boton-texto-peligro" onClick={() => setEliminando(m)}>Eliminar</button>
                      )}
                    </>
                  )
            }
          />
        )}
      </EstadoConsulta>

      {formulario && (
        <ModalFormulario
          titulo={formulario.nueva ? (esSocio ? 'Contratar plan' : 'Nueva membresía') : 'Editar membresía'}
          campos={campos}
          valoresIniciales={formulario.nueva ? {} : formulario}
          onGuardar={guardar}
          onCerrar={() => setFormulario(null)}
        />
      )}
      {cancelando && (
        <ConfirmarAccion
          titulo="Cancelar membresía"
          mensaje={`¿Seguro que quieres cancelar la membresía de ${cancelando.socioNombre}?`}
          textoBoton="Cancelar membresía"
          onConfirmar={cancelar}
          onCerrar={() => setCancelando(null)}
        />
      )}
      {eliminando && (
        <ConfirmarAccion
          titulo="Eliminar membresía"
          mensaje={`¿Seguro que quieres eliminar la membresía de ${eliminando.socioNombre}?`}
          onConfirmar={eliminar}
          onCerrar={() => setEliminando(null)}
        />
      )}
    </>
  );
}
