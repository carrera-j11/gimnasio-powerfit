import { useState } from 'react';
import { membresiasApi, pagosApi } from '../api/servicios.js';
import Cabecera from '../components/Cabecera.jsx';
import ConfirmarAccion from '../components/ConfirmarAccion.jsx';
import { EstadoConsulta } from '../components/Estados.jsx';
import ModalFormulario from '../components/ModalFormulario.jsx';
import TablaDatos from '../components/TablaDatos.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useAvisos } from '../context/AvisosContext.jsx';
import { useConsulta } from '../hooks/useConsulta.js';
import { dinero, etiqueta, fecha, OPCIONES_METODO } from '../utils/formato.js';

export default function Pagos() {
  const { rol } = useAuth();
  const avisar = useAvisos();
  const esSocio = rol === 'SOCIO';
  const pagos = useConsulta(esSocio ? pagosApi.mios : pagosApi.listar);
  const membresias = useConsulta(esSocio ? membresiasApi.mias : membresiasApi.listar);
  const [formulario, setFormulario] = useState(null); // null, { nuevo: true } o el pago a editar
  const [eliminando, setEliminando] = useState(null);

  // Solo se puede pagar una membresía activa con saldo; al editar se conserva la del pago
  const conSaldo = (membresias.datos ?? []).filter((m) => m.estado === 'ACTIVA' && Number(m.saldoPendiente) > 0);
  const opcionesMembresia = formulario?.nuevo
    ? conSaldo.map((m) => ({ valor: m.id, texto: `${m.socioNombre}, ${m.planNombre} (saldo ${dinero(m.saldoPendiente)})` }))
    : formulario
      ? [{ valor: formulario.membresiaId, texto: `${formulario.socioNombre}, ${formulario.planNombre}` }]
      : [];

  const campos = [
    {
      nombre: 'membresiaId',
      etiqueta: 'Membresía',
      tipo: 'select',
      requerido: true,
      numerico: true,
      opciones: opcionesMembresia,
      deshabilitado: !formulario?.nuevo,
    },
    { nombre: 'monto', etiqueta: 'Monto (USD)', tipo: 'number', requerido: true, numerico: true, min: 0.01, step: '0.01' },
    {
      nombre: 'metodoPago',
      etiqueta: 'Método de pago',
      tipo: 'select',
      requerido: true,
      // El efectivo solo se recibe en recepción
      opciones: esSocio ? OPCIONES_METODO.filter((o) => o.valor !== 'EFECTIVO') : OPCIONES_METODO,
    },
    { nombre: 'referencia', etiqueta: 'Referencia', maxLength: 50, ayuda: 'Obligatoria para transferencias.' },
  ];

  const guardar = async (datos) => {
    if (!formulario.nuevo) await pagosApi.editar(formulario.id, datos);
    else if (esSocio) await pagosApi.pagar(datos);
    else await pagosApi.crear(datos);
    avisar(formulario.nuevo ? 'Pago registrado' : 'Pago actualizado');
    setFormulario(null);
    pagos.recargar();
    membresias.recargar();
  };

  const eliminar = async () => {
    await pagosApi.eliminar(eliminando.id);
    avisar('Pago eliminado');
    setEliminando(null);
    pagos.recargar();
    membresias.recargar();
  };

  const columnas = [
    { titulo: 'Fecha', valor: (p) => fecha(p.fechaPago) },
    ...(esSocio ? [] : [{ titulo: 'Socio', valor: (p) => p.socioNombre }]),
    { titulo: 'Plan', valor: (p) => p.planNombre },
    { titulo: 'Método', valor: (p) => etiqueta(p.metodoPago) },
    { titulo: 'Referencia', valor: (p) => p.referencia || 'Sin referencia' },
    { titulo: 'Monto', valor: (p) => dinero(p.monto) },
  ];

  return (
    <>
      <Cabecera titulo={esSocio ? 'Mis pagos' : 'Pagos'}>
        <button type="button" className="boton boton-principal" onClick={() => setFormulario({ nuevo: true })}>
          Registrar pago
        </button>
      </Cabecera>

      <EstadoConsulta consulta={pagos} textoVacio="No existen pagos registrados.">
        {(datos) => (
          <TablaDatos
            etiqueta="Lista de pagos"
            columnas={columnas}
            filas={datos}
            acciones={
              esSocio
                ? undefined
                : (p) => (
                    <>
                      <button type="button" className="boton" onClick={() => setFormulario(p)}>Editar</button>
                      {rol === 'ADMIN' && (
                        <button type="button" className="boton boton-texto-peligro" onClick={() => setEliminando(p)}>Eliminar</button>
                      )}
                    </>
                  )
            }
          />
        )}
      </EstadoConsulta>

      {formulario && (
        <ModalFormulario
          titulo={formulario.nuevo ? 'Registrar pago' : 'Editar pago'}
          campos={campos}
          valoresIniciales={formulario.nuevo ? {} : formulario}
          onGuardar={guardar}
          onCerrar={() => setFormulario(null)}
        />
      )}
      {eliminando && (
        <ConfirmarAccion
          titulo="Eliminar pago"
          mensaje={`¿Seguro que quieres eliminar el pago de ${dinero(eliminando.monto)} de ${eliminando.socioNombre}?`}
          onConfirmar={eliminar}
          onCerrar={() => setEliminando(null)}
        />
      )}
    </>
  );
}
