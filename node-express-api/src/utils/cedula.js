/**
 * Valida una cédula ecuatoriana:
 * 10 dígitos, provincia 01-24 o 30, tercer dígito < 6 y dígito verificador (módulo 10).
 * Devuelve null si es válida, o el mensaje de error.
 */
function validarCedula(cedula) {
  if (!/^\d{10}$/.test(cedula)) {
    return 'La cédula debe tener exactamente 10 dígitos numéricos';
  }
  const provincia = Number(cedula.substring(0, 2));
  if ((provincia < 1 || provincia > 24) && provincia !== 30) {
    return 'Los dos primeros dígitos de la cédula no corresponden a una provincia válida';
  }
  if (Number(cedula[2]) >= 6) {
    return 'El tercer dígito de la cédula debe ser menor a 6';
  }
  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;
  for (let i = 0; i < 9; i++) {
    let valor = Number(cedula[i]) * coeficientes[i];
    if (valor > 9) valor -= 9;
    suma += valor;
  }
  const verificador = (10 - (suma % 10)) % 10;
  if (verificador !== Number(cedula[9])) {
    return 'La cédula no es válida (dígito verificador incorrecto)';
  }
  return null;
}

module.exports = { validarCedula };
