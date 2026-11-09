// Un objeto por recurso de la API. Cada función corresponde a un endpoint REST.
import { peticion } from './cliente.js';

const crear = (ruta, datos) => peticion(ruta, { metodo: 'POST', datos });
const editar = (ruta, datos) => peticion(ruta, { metodo: 'PUT', datos });
const eliminar = (ruta) => peticion(ruta, { metodo: 'DELETE' });

export const authApi = {
  login: (datos) => crear('/auth/login', datos),
};

export const planesApi = {
  listar: () => peticion('/planes'),
  editar: (tipo, datos) => editar(`/planes/${tipo}`, datos),
};

export const sociosApi = {
  listar: () => peticion('/socios'),
  editar: (id, datos) => editar(`/socios/${id}`, datos),
  eliminar: (id) => eliminar(`/socios/${id}`),
};

export const entrenadoresApi = {
  listar: () => peticion('/entrenadores'),
  editar: (id, datos) => editar(`/entrenadores/${id}`, datos),
  eliminar: (id) => eliminar(`/entrenadores/${id}`),
};

export const clasesApi = {
  listar: () => peticion('/clases'),
  crear: (datos) => crear('/clases', datos),
  editar: (id, datos) => editar(`/clases/${id}`, datos),
  eliminar: (id) => eliminar(`/clases/${id}`),
};

export const membresiasApi = {
  listar: () => peticion('/membresias'),
  mias: () => peticion('/membresias/mias'),
  crear: (datos) => crear('/membresias', datos),
  contratar: (datos) => crear('/membresias/contratar', datos),
  editar: (id, datos) => editar(`/membresias/${id}`, datos),
  cancelar: (id) => peticion(`/membresias/${id}/cancelar`, { metodo: 'PATCH' }),
  eliminar: (id) => eliminar(`/membresias/${id}`),
};

export const pagosApi = {
  listar: () => peticion('/pagos'),
  mios: () => peticion('/pagos/mios'),
  crear: (datos) => crear('/pagos', datos),
  pagar: (datos) => crear('/pagos/pagar', datos),
  editar: (id, datos) => editar(`/pagos/${id}`, datos),
  eliminar: (id) => eliminar(`/pagos/${id}`),
};

export const inscripcionesApi = {
  listar: () => peticion('/inscripciones'),
  mias: () => peticion('/inscripciones/mias'),
  crear: (datos) => crear('/inscripciones', datos),
  eliminar: (id) => eliminar(`/inscripciones/${id}`),
};
