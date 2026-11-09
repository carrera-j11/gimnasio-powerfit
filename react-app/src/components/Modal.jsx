import { useId, useLayoutEffect, useRef } from 'react';

/**
 * Ventana modal basada en <dialog>: el navegador mantiene el foco dentro y cierra con Escape.
 * Al cerrar, el foco vuelve al botón que la abrió.
 */
export default function Modal({ titulo, onCerrar, children }) {
  const dialogo = useRef(null);
  const idTitulo = useId();

  // useLayoutEffect: su limpieza se ejecuta antes de quitar el <dialog> de la página,
  // y así el navegador todavía puede devolver el foco
  useLayoutEffect(() => {
    const elemento = dialogo.current;
    const anterior = document.activeElement;
    elemento.showModal();
    return () => {
      elemento.close();
      if (anterior?.isConnected) anterior.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialogo}
      className="modal"
      aria-labelledby={idTitulo}
      onCancel={(e) => {
        e.preventDefault();
        onCerrar();
      }}
    >
      <h2 id={idTitulo}>{titulo}</h2>
      {children}
    </dialog>
  );
}
