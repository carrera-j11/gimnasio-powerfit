import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { CLAVE_SESION } from '../api/cliente.js';
import { authApi } from '../api/servicios.js';

const AuthContext = createContext(null);

function leerSesion() {
  try {
    const sesion = JSON.parse(localStorage.getItem(CLAVE_SESION));
    return sesion && sesion.expiraEn > Date.now() ? sesion : null;
  } catch {
    return null;
  }
}

/** Guarda la sesión (token JWT y usuario) y la comparte con toda la aplicación. */
export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(leerSesion);
  const [sesionVencida, setSesionVencida] = useState(false);

  const cerrarSesion = useCallback(() => {
    localStorage.removeItem(CLAVE_SESION);
    setSesion(null);
  }, []);

  const iniciarSesion = useCallback(async (email, password) => {
    const respuesta = await authApi.login({ email, password });
    const nueva = {
      token: respuesta.token,
      usuario: respuesta.usuario,
      expiraEn: Date.now() + respuesta.expiraEnSegundos * 1000,
    };
    localStorage.setItem(CLAVE_SESION, JSON.stringify(nueva));
    setSesionVencida(false);
    setSesion(nueva);
  }, []);

  // cliente.js dispara este evento cuando la API responde 401 a una petición con token
  useEffect(() => {
    const alVencer = () => {
      setSesionVencida(true);
      cerrarSesion();
    };
    window.addEventListener('sesion-expirada', alVencer);
    return () => window.removeEventListener('sesion-expirada', alVencer);
  }, [cerrarSesion]);

  const valor = {
    usuario: sesion?.usuario ?? null,
    rol: sesion?.usuario?.rol ?? null,
    sesionVencida,
    iniciarSesion,
    cerrarSesion,
  };
  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
