package com.gimnasio.api.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

/** Explica qué está mal en el formato del código de verificación. */
public class CodigoVerificacionValidator implements ConstraintValidator<CodigoVerificacion, String> {

    @Override
    public boolean isValid(String codigo, ConstraintValidatorContext context) {
        if (codigo == null || codigo.isBlank()) {
            return true; // de esto se encarga @NotBlank
        }
        String mensaje = null;
        if (!codigo.matches("\\d+")) {
            mensaje = "El código solo debe contener números (revise que no haya letras ni espacios). Se ingresó: '" + codigo + "'";
        } else if (codigo.length() != 6) {
            mensaje = "El código debe tener exactamente 6 dígitos. Se ingresaron " + codigo.length();
        }
        if (mensaje == null) {
            return true;
        }
        context.disableDefaultConstraintViolation();
        context.buildConstraintViolationWithTemplate(mensaje).addConstraintViolation();
        return false;
    }
}
