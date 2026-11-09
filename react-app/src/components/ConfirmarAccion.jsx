import { useEffect, useRef, useState } from 'react';
import Modal from './Modal.jsx';

/** Pide confirmación antes de una acción importante y muestra el error si la API la rechaza. */
export default function ConfirmarAccion({ titulo, mensaje, textoBoton = 'Eliminar', onConfirmar, onCerrar }) {
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const alerta = useRef(null);

  // El botón se desactiva al enviar y pierde el foco: si hay error, el foco pasa al mensaje
  useEffect(() => {
    if (error) alerta.current?.focus();
  }, [error]);

  const confirmar = async () => {
    setEnviando(true);
    setError(null);
    try {
      await onConfirmar();
    } catch (e) {
      setError(e.message);
      setEnviando(false);
    }
  };

  return (
    <Modal titulo={titulo} onCerrar={onCerrar}>
      <p>{mensaje}</p>
      {error && <div className="alerta" role="alert" tabIndex={-1} ref={alerta}>{error}</div>}
      <div className="modal-acciones">
        <button type="button" className="boton" onClick={onCerrar} autoFocus>Cancelar</button>
        <button type="button" className="boton boton-peligro" onClick={confirmar} disabled={enviando}>
          {enviando ? 'Procesando…' : textoBoton}
        </button>
      </div>
    </Modal>
  );
}
