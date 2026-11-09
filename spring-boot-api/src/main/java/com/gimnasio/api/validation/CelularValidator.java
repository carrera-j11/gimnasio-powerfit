package com.gimnasio.api.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

/** Explica exactamente qué está mal en el número de celular. */
public class CelularValidator implements ConstraintValidator<Celular, String> {

    @Override
    public boolean isValid(String celular, ConstraintValidatorContext context) {
        if (celular == null || celular.isBlank()) {
            return true; // de esto se encarga @NotBlank
        }
        if (!celular.matches("\\d+")) {
            return error(context, "El celular solo debe contener números, sin espacios, guiones, letras ni el prefijo +593 "
                    + "(ejemplo: 0987654321). Se ingresó: '" + celular + "'");
        }
        if (!celular.startsWith("09")) {
            return error(context, "El celular debe empezar con 09 (formato de celulares en Ecuador). "
                    + "Se ingresó un número que empieza con '" + celular.substring(0, Math.min(2, celular.length())) + "'");
        }
        if (celular.length() != 10) {
            return error(context, "El celular debe tener exactamente 10 dígitos incluyendo el 09. "
                    + "Se ingresaron " + celular.length() + " dígitos");
        }
        return true;
    }

    private boolean error(ConstraintValidatorContext context, String mensaje) {
        context.disableDefaultConstraintViolation();
        context.buildConstraintViolationWithTemplate(mensaje).addConstraintViolation();
        return false;
    }
}
