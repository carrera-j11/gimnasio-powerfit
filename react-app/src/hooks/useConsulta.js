import { useCallback, useEffect, useState } from 'react';

/**
 * Ejecuta una consulta a la API al montar el componente y expone sus estados:
 * cargando, datos y error. recargar() vuelve a pedir la información.
 */
export function useConsulta(funcion) {
  const [estado, setEstado] = useState({ datos: null, cargando: true, error: null });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let activo = true; // evita actualizar el estado si el componente ya se desmontó
    setEstado((actual) => ({ ...actual, cargando: true, error: null }));
    funcion()
      .then((datos) => activo && setEstado({ datos, cargando: false, error: null }))
      .catch((error) => activo && setEstado({ datos: null, cargando: false, error: error.message }));
    return () => {
      activo = false;
    };
    // La función se crea en cada render; solo se vuelve a consultar al llamar a recargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  const recargar = useCallback(() => setVersion((v) => v + 1), []);
  return { ...estado, recargar };
}
