import { Link } from 'react-router-dom';
import { clasesApi, entrenadoresApi, inscripcionesApi, membresiasApi, pagosApi, sociosApi } from '../api/servicios.js';
import Cabecera from '../components/Cabecera.jsx';
import { EstadoConsulta } from '../components/Estados.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useConsulta } from '../hooks/useConsulta.js';
import { dinero } from '../utils/formato.js';

const suma = (lista, campo) => lista.reduce((total, item) => total + Number(item[campo] ?? 0), 0);

/** Cada rol ve un resumen calculado con los datos que la API le permite consultar. */
async function cargarResumen(rol) {
  if (rol === 'ADMIN' || rol === 'RECEPCIONISTA') {
    const [socios, membresias, pagos, clases] = await Promise.all([
      sociosApi.listar(), membresiasApi.listar(), pagosApi.listar(), clasesApi.listar(),
    ]);
    return [
      { texto: 'Socios registrados', valor: socios.length, ruta: '/socios' },
      { texto: 'Membresías activas', valor: membresias.filter((m) => m.estado === 'ACTIVA').length, ruta: '/membresias' },
      { texto: 'Saldo pendiente', valor: dinero(suma(membresias, 'saldoPendiente')), ruta: '/membresias' },
      { texto: 'Total de pagos', valor: dinero(suma(pagos, 'monto')), ruta: '/pagos' },
      { texto: 'Clases semanales', valor: clases.length, ruta: '/clases' },
    ];
  }
  if (rol === 'SOCIO') {
    const [membresias, inscripciones] = await Promise.all([membresiasApi.mias(), inscripcionesApi.mias()]);
    return [
      { texto: 'Membresías activas', valor: membresias.filter((m) => m.estado === 'ACTIVA').length, ruta: '/membresias' },
      { texto: 'Saldo pendiente', valor: dinero(suma(membresias, 'saldoPendiente')), ruta: '/pagos' },
      { texto: 'Clases inscritas', valor: inscripciones.length, ruta: '/inscripciones' },
    ];
  }
  const [clases, entrenadores] = await Promise.all([clasesApi.listar(), entrenadoresApi.listar()]);
  return [
    { texto: 'Clases semanales', valor: clases.length, ruta: '/clases' },
    { texto: 'Entrenadores', valor: entrenadores.length, ruta: '/entrenadores' },
  ];
}

export default function Inicio() {
  const { usuario, rol } = useAuth();
  const resumen = useConsulta(() => cargarResumen(rol));

  return (
    <>
      <Cabecera titulo={`Hola, ${usuario.nombres}`} descripcion="Resumen del gimnasio con datos actuales de la API." />
      <EstadoConsulta consulta={resumen}>
        {(datos) => (
          <div className="resumen">
            {datos.map((d) => (
              <Link key={d.texto} to={d.ruta} className="dato-resumen">
                <strong>{d.valor}</strong>
                <span>{d.texto}</span>
              </Link>
            ))}
          </div>
        )}
      </EstadoConsulta>
    </>
  );
}
