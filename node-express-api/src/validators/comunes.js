const { body, param } = require('express-validator');
const { validarCedula } = require('../utils/cedula');
const { hoy } = require('../utils/fechas');

const REGEX_LETRAS = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü ]+$/;
const REGEX_HORA = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;
const REGEX_DECIMAL = /^\d+(\.\d{1,2})?$/;

/** Id en la URL: /api/socios/:id */
const idParam = (nombre = 'id') =>
  param(nombre).isInt({ min: 1 }).withMessage(`El parámetro '${nombre}' debe ser un número entero positivo`).toInt();

/** Id de una relación en el body (socioId, claseId...). */
const idBody = (campo, etiqueta, { opcional = false } = {}) => {
  let cadena = body(campo);
  cadena = opcional
    ? cadena.optional({ values: 'null' })
    : cadena.exists({ values: 'null' }).withMessage(`El id ${etiqueta} es obligatorio`).bail();
  return cadena.isInt({ min: 1 }).withMessage(`El id ${etiqueta} debe ser un número entero positivo`).toInt();
};

const cedula = () =>
  body('cedula')
    .exists({ values: 'falsy' }).withMessage('La cédula es obligatoria').bail()
    .isString().withMessage('La cédula debe enviarse como texto').bail()
    .trim()
    .custom((valor) => {
      const error = validarCedula(valor);
      if (error) throw new Error(error);
      return true;
    });

/** Nombres o apellidos: obligatorios, 2-50 letras. */
const textoLetras = (campo, etiqueta) =>
  body(campo)
    .exists({ values: 'falsy' }).withMessage(`${etiqueta} son obligatorios`).bail()
    .isString().withMessage(`${etiqueta} deben ser texto`).bail()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage(`${etiqueta} deben tener entre 2 y 50 caracteres`).bail()
    .matches(REGEX_LETRAS).withMessage(`${etiqueta} solo pueden contener letras y espacios (sin números ni símbolos)`);

const email = (campo = 'email') =>
  body(campo)
    .exists({ values: 'falsy' }).withMessage('El email es obligatorio').bail()
    .isString().withMessage('El email debe ser texto').bail()
    .trim()
    .isEmail().withMessage('El email no tiene un formato válido (ejemplo: nombre@gmail.com)').bail()
    .isLength({ max: 100 }).withMessage('El email no puede superar los 100 caracteres')
    .toLowerCase();

/** Celular de Ecuador: explica exactamente qué está mal. */
function errorCelular(celular) {
  if (!/^\d+$/.test(celular)) {
    return `El celular solo debe contener números, sin espacios, guiones, letras ni el prefijo +593 (ejemplo: 0987654321). Se ingresó: '${celular}'`;
  }
  if (!celular.startsWith('09')) {
    return `El celular debe empezar con 09 (formato de celulares en Ecuador). Se ingresó un número que empieza con '${celular.substring(0, 2)}'`;
  }
  if (celular.length !== 10) {
    return `El celular debe tener exactamente 10 dígitos incluyendo el 09. Se ingresaron ${celular.length} dígitos`;
  }
  return null;
}

const celular = () =>
  body('celular')
    .exists({ values: 'falsy' }).withMessage('El celular es obligatorio').bail()
    .isString().withMessage('El celular debe enviarse como texto, entre comillas (ej. "0987654321")').bail()
    .trim()
    .custom((valor) => {
      const error = errorCelular(valor);
      if (error) throw new Error(error);
      return true;
    });

/** Contraseña segura: indica TODOS los requisitos que faltan. */
function erroresPassword(password) {
  const problemas = [];
  if (password.length < 8) problemas.push(`debe tener al menos 8 caracteres (tiene ${password.length})`);
  if (password.length > 60) problemas.push(`no puede superar los 60 caracteres (tiene ${password.length})`);
  if (!/[A-Z]/.test(password)) problemas.push('debe incluir al menos una letra MAYÚSCULA');
  if (!/[a-z]/.test(password)) problemas.push('debe incluir al menos una letra minúscula');
  if (!/\d/.test(password)) problemas.push('debe incluir al menos un número');
  if (!/[^A-Za-z0-9\s]/.test(password)) problemas.push('debe incluir al menos un carácter especial (ej. * . # @ ! $)');
  if (/\s/.test(password)) problemas.push('no debe contener espacios');
  return problemas.length ? `La contraseña no es segura: ${problemas.join('; ')}` : null;
}

/** Código de verificación: 6 dígitos numéricos. */
function errorCodigo(codigo) {
  if (!/^\d+$/.test(codigo)) return `El código solo debe contener números (revise que no haya letras ni espacios). Se ingresó: '${codigo}'`;
  if (codigo.length !== 6) return `El código debe tener exactamente 6 dígitos. Se ingresaron ${codigo.length}`;
  return null;
}

const conMensaje = (fn) => (valor) => {
  const error = fn(valor);
  if (error) throw new Error(error);
  return true;
};

/** Fecha 'YYYY-MM-DD'. momento: 'pasada' o null */
const fecha = (campo, etiqueta, { opcional = false, momento = null } = {}) => {
  let cadena = body(campo);
  cadena = opcional
    ? cadena.optional({ values: 'null' })
    : cadena.exists({ values: 'falsy' }).withMessage(`${etiqueta} es obligatoria`).bail();
  cadena = cadena
    .isDate({ format: 'YYYY-MM-DD', strictMode: true })
    .withMessage(`${etiqueta} no es válida. Use el formato yyyy-MM-dd (ej. 2002-05-14)`).bail();
  if (momento === 'pasada') {
    cadena = cadena.custom((v) => { if (v >= hoy()) throw new Error(`${etiqueta} debe ser una fecha pasada`); return true; });
  }
  return cadena;
};

const hora = (campo, etiqueta) =>
  body(campo)
    .exists({ values: 'falsy' }).withMessage(`${etiqueta} es obligatoria`).bail()
    .isString().withMessage(`${etiqueta} debe ser texto`).bail()
    .matches(REGEX_HORA).withMessage(`${etiqueta} no es válida. Use el formato HH:mm (ej. 07:30)`);

const opcionLista = (campo, etiqueta, valores) =>
  body(campo)
    .exists({ values: 'falsy' }).withMessage(`${etiqueta} es obligatorio (${valores.join(', ')})`).bail()
    .isIn(valores).withMessage((valor) => `El valor '${valor}' no es válido. Valores permitidos: [${valores.join(', ')}]`);

const textoOpcional = (campo, max, etiqueta) =>
  body(campo)
    .optional({ values: 'null' })
    .isString().withMessage(`${etiqueta} debe ser texto`).bail()
    .trim()
    .isLength({ max }).withMessage(`${etiqueta} no puede superar los ${max} caracteres`);

/** Dinero: número con máximo 2 decimales, entre minimo y maximo. */
const dinero = (campo, etiqueta, minimo, maximo) =>
  body(campo)
    .exists({ values: 'null' }).withMessage(`${etiqueta} es obligatorio`).bail()
    .isFloat().withMessage((valor) => `El valor '${valor}' no es un número válido`).bail()
    .custom((v) => {
      if (Number(v) < minimo) throw new Error(`${etiqueta} debe ser al menos ${minimo}`);
      if (Number(v) > maximo) throw new Error(`${etiqueta} no puede superar ${maximo}`);
      if (!REGEX_DECIMAL.test(String(v))) throw new Error(`${etiqueta} puede tener máximo 2 decimales`);
      return true;
    })
    .toFloat();

const entero = (campo, mensajeObligatorio, min, max, mensajeRango) =>
  body(campo)
    .exists({ values: 'null' }).withMessage(mensajeObligatorio).bail()
    .isInt().withMessage((valor) => `El valor '${valor}' no es un número entero válido`).bail()
    .isInt({ min, max }).withMessage(mensajeRango)
    .toInt();

module.exports = {
  REGEX_LETRAS, erroresPassword, errorCodigo, conMensaje, idParam, idBody, cedula, textoLetras, email, celular,
  fecha, hora, opcionLista, textoOpcional, dinero, entero
};
