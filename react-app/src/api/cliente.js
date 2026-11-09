// Cliente HTTP: todas las peticiones a la API REST pasan por aquí.

const API_URL = import.meta.env.VITE_API_URL;
export const CLAVE_SESION = 'powerfit.sesion';

/** Error de la API con un mensaje listo para mostrar y, si los hay, errores por campo. */
export class ErrorApi extends Error {
  constructor(mensaje, status, errores = null) {
    super(mensaje);
    this.status = status;
    this.errores = errores;
  }
}

function obtenerToken() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_SESION))?.token ?? null;
  } catch {
    return null;
  }
}

function mensajePorEstado(status) {
  if (status === 401) return 'Tu sesión no es válida. Vuelve a iniciar sesión.';
  if (status === 403) return 'No tienes permiso para realizar esta acción.';
  if (status === 404) return 'No se encontró la información solicitada.';
  if (status >= 500) return 'El servidor tuvo un problema. Inténtalo de nuevo más tarde.';
  return 'No se pudo completar la solicitud.';
}

/**
 * Hace una petición a la API y devuelve el JSON de la respuesta.
 * Si algo falla lanza un ErrorApi, que luego muestran los componentes.
 */
export async function peticion(ruta, { metodo = 'GET', datos } = {}) {
  const token = obtenerToken();
  const headers = {};
  if (datos !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      method: metodo,
      headers,
      body: datos !== undefined ? JSON.stringify(datos) : undefined,
    });
  } catch {
    // fetch solo falla así cuando no hay conexión con el servidor
    throw new ErrorApi('No se pudo conectar con la API. Comprueba que el servidor esté encendido.', 0);
  }

  if (respuesta.status === 204) return null;
  const cuerpo = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    // Un 401 con token significa que la sesión venció: se avisa a AuthContext
    if (respuesta.status === 401 && token) window.dispatchEvent(new Event('sesion-expirada'));
    throw new ErrorApi(cuerpo?.mensaje ?? mensajePorEstado(respuesta.status), respuesta.status, cuerpo?.errores ?? null);
  }
  return cuerpo;
}
