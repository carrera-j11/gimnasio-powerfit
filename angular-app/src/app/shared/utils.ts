import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';
import { ApiError } from '../core/models';

/** Mensaje principal de un error de la API. */
export function mensajeError(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) {
      return 'No se pudo conectar con la API. Verifique que el servidor esté encendido y que tenga conexión con él.';
    }
    const body = err.error as ApiError | null;
    if (body?.mensaje) {
      const campos = body.errores ? Object.values(body.errores) : [];
      return campos.length ? `${body.mensaje}: ${campos.join(' · ')}` : body.mensaje;
    }
    return `Error ${err.status}: ${err.statusText}`;
  }
  return 'Ocurrió un error inesperado';
}

/**
 * Coloca los errores por campo que devuelve la API (errores: { campo: mensaje })
 * en los controles del formulario, para mostrarlos debajo de cada uno.
 * Devuelve true si asignó al menos uno.
 */
export function aplicarErroresApi(form: FormGroup, err: unknown): boolean {
  if (!(err instanceof HttpErrorResponse)) return false;
  const errores = (err.error as ApiError | null)?.errores;
  if (!errores) return false;
  let asignado = false;
  for (const [campo, msg] of Object.entries(errores)) {
    const control = form.get(campo) ?? (campo === 'rolSolicitado' ? form.get('rol') : null);
    if (control) {
      control.setErrors({ api: msg });
      control.markAsTouched();
      asignado = true;
    }
  }
  return asignado;
}

/** Texto del primer error de un control para mostrarlo en la plantilla. */
export function errorDe(control: AbstractControl | null): string | null {
  if (!control || !control.errors || !(control.touched || control.dirty)) return null;
  const e = control.errors;
  if (e['api']) return e['api'];
  if (e['required']) return 'Este campo es obligatorio';
  if (e['email']) return 'El email no tiene un formato válido';
  if (e['minlength']) return `Debe tener al menos ${e['minlength'].requiredLength} caracteres`;
  if (e['maxlength']) return `No puede superar ${e['maxlength'].requiredLength} caracteres`;
  if (e['min']) return `El valor mínimo es ${e['min'].min}`;
  if (e['max']) return `El valor máximo es ${e['max'].max}`;
  if (e['pattern']) return 'Formato no válido';
  for (const valor of Object.values(e)) {
    if (typeof valor === 'string') return valor;
  }
  return 'Valor no válido';
}

// ===== Validadores que replican los de la API =====

const SOLO_LETRAS = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü ]+$/;

export const soloLetras: ValidatorFn = (c) =>
  !c.value || SOLO_LETRAS.test(c.value) ? null : { letras: 'Solo puede contener letras y espacios' };

/** Cédula ecuatoriana: 10 dígitos, provincia 01-24 (o 30), tercer dígito < 6 y dígito verificador módulo 10. */
export const cedula: ValidatorFn = (c) => {
  const v: string = c.value ?? '';
  if (!v) return null;
  if (!/^\d{10}$/.test(v)) return { cedula: 'La cédula debe tener exactamente 10 dígitos numéricos' };
  const provincia = Number(v.substring(0, 2));
  if (!((provincia >= 1 && provincia <= 24) || provincia === 30)) {
    return { cedula: 'Los dos primeros dígitos (provincia) no son válidos' };
  }
  if (Number(v[2]) >= 6) return { cedula: 'El tercer dígito de la cédula debe ser menor a 6' };
  let suma = 0;
  for (let i = 0; i < 9; i++) {
    let d = Number(v[i]) * (i % 2 === 0 ? 2 : 1);
    if (d > 9) d -= 9;
    suma += d;
  }
  const verificador = (10 - (suma % 10)) % 10;
  return verificador === Number(v[9]) ? null : { cedula: 'La cédula no es válida (dígito verificador incorrecto)' };
};

export const celular: ValidatorFn = (c) => {
  const v: string = c.value ?? '';
  if (!v) return null;
  if (!/^\d+$/.test(v)) return { celular: 'El celular solo puede contener números' };
  if (!v.startsWith('09')) return { celular: 'El celular debe empezar con 09' };
  if (v.length !== 10) return { celular: `El celular debe tener exactamente 10 dígitos (tiene ${v.length})` };
  return null;
};

export const passwordSegura: ValidatorFn = (c) => {
  const v: string = c.value ?? '';
  if (!v) return null;
  const faltan: string[] = [];
  if (v.length < 8) faltan.push('al menos 8 caracteres');
  if (!/[A-Z]/.test(v)) faltan.push('una mayúscula');
  if (!/[a-z]/.test(v)) faltan.push('una minúscula');
  if (!/\d/.test(v)) faltan.push('un número');
  if (!/[^A-Za-z0-9\s]/.test(v)) faltan.push('un carácter especial');
  if (/\s/.test(v)) faltan.push('sin espacios');
  return faltan.length ? { password: `La contraseña necesita: ${faltan.join(', ')}` } : null;
};

export const codigo6: ValidatorFn = (c) =>
  !c.value || /^\d{6}$/.test(c.value) ? null : { codigo: 'El código debe tener exactamente 6 dígitos' };

/** Valida la edad mínima a partir de la fecha de nacimiento (yyyy-MM-dd). */
export function edadMinima(anios: () => number): ValidatorFn {
  return (c: AbstractControl): ValidationErrors | null => {
    if (!c.value) return null;
    const nac = new Date(c.value + 'T00:00:00');
    const hoy = new Date();
    if (nac >= hoy) return { edad: 'La fecha de nacimiento debe ser una fecha pasada' };
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
    const min = anios();
    return edad < min ? { edad: `La edad mínima para este rol es ${min} años` } : null;
  };
}

/** Fecha local de hoy en formato yyyy-MM-dd. */
export function hoyISO(desplazamientoDias = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + desplazamientoDias);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** Texto en minúsculas sin tildes, para buscar. */
export function normalizar(texto: string | null | undefined): string {
  return (texto ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}
