import { useState } from 'react';
import { clasesApi, inscripcionesApi, sociosApi } from '../api/servicios.js';
import Cabecera from '../components/Cabecera.jsx';
import ConfirmarAccion from '../components/ConfirmarAccion.jsx';
import { EstadoConsulta } from '../components/Estados.jsx';
import ModalFormulario from '../components/ModalFormulario.jsx';
import TablaDatos from '../components/TablaDatos.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useAvisos } from '../context/AvisosContext.jsx';
import { useConsulta } from '../hooks/useConsulta.js';
import { fecha, nombreCompleto, textoDia } from '../utils/formato.js';

export default function Inscripciones() {
  const { rol } = useAuth();
  const avisar = useAvisos();
  const esSocio = rol === 'SOCIO';
  const inscripciones = useConsulta(esSocio ? inscripcionesApi.mias : inscripcionesApi.listar);
  const clases = useConsulta(clasesApi.listar);
  const socios = useConsulta(() => (esSocio ? Promise.resolve([]) : sociosApi.listar()));
  const [creando, setCreando] = useState(false);
  const [eliminando, setEliminando] = useState(null);

  const campoClase = {
    nombre: 'claseId',
    etiqueta: 'Clase',
    tipo: 'select',
    requerido: true,
    numerico: true,
    opciones: (clases.datos ?? []).map((c) => ({
      valor: c.id,
      texto: `${c.nombre}, ${textoDia(c.diaSemana)} ${c.horaInicio?.slice(0, 5)} (${c.cuposDisponibles} cupos)`,
    })),
  };
  const campoSocio = {
    nombre: 'socioId',
    etiqueta: 'Socio',
    tipo: 'select',
    requerido: true,
    numerico: true,
    opciones: (socios.datos ?? []).map((s) => ({ valor: s.id, texto: `${nombreCompleto(s)} (${s.cedula})` })),
  };

  const guardar = async (datos) => {
    await inscripcionesApi.crear(datos);
    avisar('Inscripción registrada');
    setCreando(false);
    inscripciones.recargar();
    clases.recargar();
  };

  const eliminar = async () => {
    await inscripcionesApi.eliminar(eliminando.id);
    avisar('Inscripción cancelada');
    setEliminando(null);
    inscripciones.recargar();
    clases.recargar();
  };

  const columnas = [
    ...(esSocio ? [] : [{ titulo: 'Socio', valor: (i) => i.socioNombre }]),
    { titulo: 'Clase', valor: (i) => i.claseNombre },
    { titulo: 'Entrenador', valor: (i) => i.entrenadorNombre },
    { titulo: 'Horario', valor: (i) => i.horario },
    { titulo: 'Inscripción', valor: (i) => fecha(i.fechaInscripcion) },
  ];

  return (
    <>
      <Cabecera titulo={esSocio ? 'Mis inscripciones' : 'Inscripciones'}>
        <button type="button" className="boton boton-principal" onClick={() => setCreando(true)}>
          Nueva inscripción
        </button>
      </Cabecera>

      <EstadoConsulta consulta={inscripciones} textoVacio="No existen inscripciones registradas.">
        {(datos) => (
          <TablaDatos
            etiqueta="Lista de inscripciones"
            columnas={columnas}
            filas={datos}
            acciones={(i) => (
              <button type="button" className="boton boton-texto-peligro" onClick={() => setEliminando(i)}>Cancelar</button>
            )}
          />
        )}
      </EstadoConsulta>

      {creando && (
        <ModalFormulario
          titulo="Nueva inscripción"
          campos={esSocio ? [campoClase] : [campoClase, campoSocio]}
          onGuardar={guardar}
          onCerrar={() => setCreando(false)}
        />
      )}
      {eliminando && (
        <ConfirmarAccion
          titulo="Cancelar inscripción"
          mensaje={`¿Seguro que quieres cancelar la inscripción en ${eliminando.claseNombre}?`}
          textoBoton="Cancelar inscripción"
          onConfirmar={eliminar}
          onCerrar={() => setEliminando(null)}
        />
      )}
    </>
  );
}
