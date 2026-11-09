import { createContext, useCallback, useContext, useRef, useState } from 'react';

const AvisosContext = createContext(null);

/** Mensajes breves de confirmación o error que aparecen en la esquina de la pantalla. */
export function AvisosProvider({ children }) {
  const [avisos, setAvisos] = useState([]);
  const siguienteId = useRef(1);

  const quitar = useCallback((id) => setAvisos((lista) => lista.filter((a) => a.id !== id)), []);

  const avisar = useCallback(
    (texto, tipo = 'ok') => {
      const id = siguienteId.current++;
      // Máximo 3 a la vez para que no terminen tapando los botones de la página
      setAvisos((lista) => [...lista.slice(-2), { id, texto, tipo }]);
      setTimeout(() => quitar(id), tipo === 'error' ? 10000 : 6000);
    },
    [quitar],
  );

  return (
    <AvisosContext.Provider value={avisar}>
      {children}
      <div className="avisos">
        {avisos.map((a) => (
          <div key={a.id} className={`aviso aviso-${a.tipo}`} role={a.tipo === 'error' ? 'alert' : 'status'}>
            <span>{a.texto}</span>
            <button type="button" className="aviso-cerrar" aria-label="Cerrar aviso" onClick={() => quitar(a.id)}>×</button>
          </div>
        ))}
      </div>
    </AvisosContext.Provider>
  );
}

export const useAvisos = () => useContext(AvisosContext);
