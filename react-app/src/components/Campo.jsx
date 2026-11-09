import { useId } from 'react';

/** Etiqueta, control y mensaje de error de un campo de formulario. */
export default function Campo({ campo, valor, error, onCambio }) {
  const id = useId();
  const { etiqueta, tipo = 'text', opciones, requerido, ayuda, deshabilitado, ...resto } = campo;
  delete resto.nombre;
  delete resto.numerico;

  const idAyuda = `${id}-ayuda`;
  const idError = `${id}-error`;
  const descripcion = [ayuda && idAyuda, error && idError].filter(Boolean).join(' ') || undefined;
  const comunes = {
    id,
    value: valor ?? '',
    disabled: deshabilitado,
    'aria-required': requerido || undefined,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': descripcion,
    onChange: (e) => onCambio(e.target.value),
  };

  return (
    <div className={error ? 'campo campo-invalido' : 'campo'}>
      <label htmlFor={id}>
        {etiqueta} {requerido && <span className="obligatorio" aria-hidden="true">*</span>}
      </label>
      {tipo === 'select' ? (
        <select {...comunes}>
          <option value="">Seleccione…</option>
          {opciones.map((o) => (
            <option key={o.valor} value={o.valor}>{o.texto}</option>
          ))}
        </select>
      ) : tipo === 'textarea' ? (
        <textarea rows={3} {...resto} {...comunes} />
      ) : (
        <input type={tipo} {...resto} {...comunes} />
      )}
      {ayuda && <small id={idAyuda}>{ayuda}</small>}
      {error && <small id={idError} className="campo-error">{error}</small>}
    </div>
  );
}
