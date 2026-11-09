import { useState } from 'react';
import { clasesApi, entrenadoresApi, inscripcionesApi } from '../api/servicios.js';
import Cabecera from '../components/Cabecera.jsx';
import ConfirmarAccion from '../components/ConfirmarAccion.jsx';
import { EstadoConsulta, SinRegistros } from '../components/Estados.jsx';
import ModalFormulario from '../components/ModalFormulario.jsx';
import TarjetaClase from '../components/TarjetaClase.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useAvisos } from '../context/AvisosContext.jsx';
import { useConsulta } from '../hooks/useConsulta.js';
import { nombreCompleto, OPCIONES_DIA } from '../utils/formato.js';

export default function Clases() {
  const { usuario, rol } = useAuth();
  const avisar = useAvisos();
  const clases = useConsulta(clasesApi.listar);
  const entrenadores = useConsulta(() => (rol === 'ADMIN' ? entrenadoresApi.listar() : Promise.resolve([])));
  const [dia, setDia] = useState('');
  const [formulario, setFormulario] = useState(null); // null, { nueva: true } o la clase a editar
  const [eliminando, setEliminando] = useState(null);
  const [inscribiendo, setInscribiendo] = useState(null);

  const puedeCrear = rol === 'ADMIN' || rol === 'ENTRENADOR';
  // Un entrenador solo gestiona sus propias clases
  const puedeGestionar = (c) => rol === 'ADMIN' || (rol === 'ENTRENADOR' && c.entrenadorId === usuario.perfilId);

  const campos = [
    { nombre: 'nombre', etiqueta: 'Nombre', requerido: true, maxLength: 50 },
    { nombre: 'descripcion', etiqueta: 'Descripción', tipo: 'textarea', maxLength: 255 },
    { nombre: 'diaSemana', etiqueta: 'Día', tipo: 'select', requerido: true, opciones: OPCIONES_DIA },
    { nombre: 'horaInicio', etiqueta: 'Hora de inicio', tipo: 'time', requerido: true },
    { nombre: 'horaFin', etiqueta: 'Hora de fin', tipo: 'time', requerido: true },
    { nombre: 'cupoMaximo', etiqueta: 'Cupo máximo', tipo: 'number', requerido: true, numerico: true, min: 1, max: 30 },
  ];
  if (rol === 'ADMIN') {
    campos.push({
      nombre: 'entrenadorId',
      etiqueta: 'Entrenador',
      tipo: 'select',
      requerido: true,
      numerico: true,
      opciones: (entrenadores.datos ?? []).map((e) => ({ valor: e.id, texto: nombreCompleto(e) })),
    });
  }

  const guardar = async (datos) => {
    if (formulario.nueva) await clasesApi.crear(datos);
    else await clasesApi.editar(formulario.id, datos);
    avisar(formulario.nueva ? 'Clase registrada' : 'Clase actualizada');
    setFormulario(null);
    clases.recargar();
  };

  const eliminar = async () => {
    await clasesApi.eliminar(eliminando.id);
    avisar('Clase eliminada');
    setEliminando(null);
    clases.recargar();
  };

  const inscribirme = async () => {
    await inscripcionesApi.crear({ claseId: inscribiendo.id });
    avisar(`Te inscribiste en ${inscribiendo.nombre}`);
    setInscribiendo(null);
    clases.recargar();
  };

  return (
    <>
      <Cabecera titulo="Clases" descripcion="Horario semanal del gimnasio.">
        {puedeCrear && (
          <button type="button" className="boton boton-principal" onClick={() => setFormulario({ nueva: true })}>
            Nueva clase
          </button>
        )}
      </Cabecera>

      <EstadoConsulta consulta={clases} textoVacio="Todavía no hay clases registradas.">
        {(datos) => {
          const filtradas = datos.filter((c) => !dia || c.diaSemana === dia);
          return (
            <>
              <div className="filtros">
                <label htmlFor="filtro-dia">Día</label>
                <select id="filtro-dia" value={dia} onChange={(e) => setDia(e.target.value)}>
                  <option value="">Todos</option>
                  {OPCIONES_DIA.map((o) => (
                    <option key={o.valor} value={o.valor}>{o.texto}</option>
                  ))}
                </select>
              </div>
              {filtradas.length === 0 ? (
                <SinRegistros texto="No hay clases para ese día." />
              ) : (
                <div className="rejilla">
                  {filtradas.map((c) => (
                    <TarjetaClase key={c.id} clase={c}>
                      {puedeGestionar(c) && (
                        <>
                          <button type="button" className="boton" onClick={() => setFormulario(c)}>Editar</button>
                          <button type="button" className="boton boton-texto-peligro" onClick={() => setEliminando(c)}>Eliminar</button>
                        </>
                      )}
                      {rol === 'SOCIO' && (
                        <button type="button" className="boton" onClick={() => setInscribiendo(c)}>Inscribirme</button>
                      )}
                    </TarjetaClase>
                  ))}
                </div>
              )}
            </>
          );
        }}
      </EstadoConsulta>

      {formulario && (
        <ModalFormulario
          titulo={formulario.nueva ? 'Nueva clase' : 'Editar clase'}
          campos={campos}
          valoresIniciales={
            formulario.nueva
              ? {}
              : { ...formulario, horaInicio: formulario.horaInicio?.slice(0, 5), horaFin: formulario.horaFin?.slice(0, 5) }
          }
          onGuardar={guardar}
          onCerrar={() => setFormulario(null)}
        />
      )}
      {eliminando && (
        <ConfirmarAccion
          titulo="Eliminar clase"
          mensaje={`¿Seguro que quieres eliminar la clase ${eliminando.nombre}?`}
          onConfirmar={eliminar}
          onCerrar={() => setEliminando(null)}
        />
      )}
      {inscribiendo && (
        <ConfirmarAccion
          titulo="Inscribirme en la clase"
          mensaje={`¿Quieres inscribirte en ${inscribiendo.nombre}?`}
          textoBoton="Inscribirme"
          onConfirmar={inscribirme}
          onCerrar={() => setInscribiendo(null)}
        />
      )}
    </>
  );
}
