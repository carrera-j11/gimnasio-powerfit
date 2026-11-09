import { useEffect, useRef, useState } from 'react';
import Campo from './Campo.jsx';
import Modal from './Modal.jsx';

/**
 * Formulario reutilizable para registrar y editar. Cada página le pasa la lista de campos.
 * Comprueba los obligatorios antes de enviar y muestra los errores que devuelve la API.
 */
export default function ModalFormulario({ titulo, campos, valoresIniciales = {}, textoGuardar = 'Guardar', onGuardar, onCerrar }) {
  const [valores, setValores] = useState(valoresIniciales);
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [intentosFallidos, setIntentosFallidos] = useState(0);
  const formulario = useRef(null);

  // Después de pintar los errores, lleva el foco al primer campo con error o al mensaje general
  useEffect(() => {
    if (intentosFallidos > 0) formulario.current?.querySelector('[aria-invalid="true"], .alerta')?.focus();
  }, [intentosFallidos]);

  const enviar = async (evento) => {
    evento.preventDefault();
    const faltantes = {};
    campos.forEach((c) => {
      const valor = valores[c.nombre];
      if (c.requerido && (valor === undefined || valor === null || String(valor).trim() === '')) {
        faltantes[c.nombre] = 'Este campo es obligatorio';
      }
    });
    setErrores(faltantes);
    setErrorGeneral(null);
    if (Object.keys(faltantes).length > 0) {
      setIntentosFallidos((n) => n + 1);
      return;
    }

    // Los campos vacíos se envían como null y los numéricos como número
    const datos = {};
    campos.forEach((c) => {
      const valor = valores[c.nombre];
      const vacio = valor === undefined || valor === null || String(valor).trim() === '';
      datos[c.nombre] = vacio ? null : c.numerico ? Number(valor) : valor;
    });

    setGuardando(true);
    try {
      await onGuardar(datos); // Si todo sale bien, la página cierra este formulario
    } catch (error) {
      setErrores(error.errores ?? {});
      setErrorGeneral(error.message);
      setGuardando(false);
      setIntentosFallidos((n) => n + 1);
    }
  };

  return (
    <Modal titulo={titulo} onCerrar={onCerrar}>
      <form ref={formulario} onSubmit={enviar} noValidate>
        <p className="nota">Los campos marcados con * son obligatorios.</p>
        {campos.map((c) => (
          <Campo
            key={c.nombre}
            campo={c}
            valor={valores[c.nombre]}
            error={errores[c.nombre]}
            onCambio={(valor) => setValores((actuales) => ({ ...actuales, [c.nombre]: valor }))}
          />
        ))}
        {errorGeneral && <div className="alerta" role="alert" tabIndex={-1}>{errorGeneral}</div>}
        <div className="modal-acciones">
          <button type="button" className="boton" onClick={onCerrar}>Cancelar</button>
          <button type="submit" className="boton boton-principal" disabled={guardando}>
            {guardando ? 'Guardando…' : textoGuardar}
          </button>
        </div>
      </form>
    </Modal>
  );
}
