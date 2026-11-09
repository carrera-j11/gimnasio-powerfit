package com.gimnasio.api.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class CedulaValidator implements ConstraintValidator<Cedula, String> {

    private static final int[] COEFICIENTES = {2, 1, 2, 1, 2, 1, 2, 1, 2};

    @Override
    public boolean isValid(String cedula, ConstraintValidatorContext context) {
        // Si viene vacía, de eso se encarga @NotBlank
        if (cedula == null || cedula.isBlank()) {
            return true;
        }

        if (!cedula.matches("\\d{10}")) {
            return error(context, "La cédula debe tener exactamente 10 dígitos numéricos");
        }

        int provincia = Integer.parseInt(cedula.substring(0, 2));
        if ((provincia < 1 || provincia > 24) && provincia != 30) {
            return error(context, "Los dos primeros dígitos de la cédula no corresponden a una provincia válida");
        }

        int tercerDigito = Character.getNumericValue(cedula.charAt(2));
        if (tercerDigito >= 6) {
            return error(context, "El tercer dígito de la cédula debe ser menor a 6");
        }

        int suma = 0;
        for (int i = 0; i < 9; i++) {
            int valor = Character.getNumericValue(cedula.charAt(i)) * COEFICIENTES[i];
            if (valor > 9) {
                valor -= 9;
            }
            suma += valor;
        }
        int verificadorCalculado = (10 - (suma % 10)) % 10;
        int verificadorReal = Character.getNumericValue(cedula.charAt(9));

        if (verificadorCalculado != verificadorReal) {
            return error(context, "La cédula no es válida (dígito verificador incorrecto)");
        }
        return true;
    }

    private boolean error(ConstraintValidatorContext context, String mensaje) {
        context.disableDefaultConstraintViolation();
        context.buildConstraintViolationWithTemplate(mensaje).addConstraintViolation();
        return false;
    }
}
