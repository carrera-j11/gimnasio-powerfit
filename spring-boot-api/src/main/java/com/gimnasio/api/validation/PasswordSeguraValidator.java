package com.gimnasio.api.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.ArrayList;
import java.util.List;

/** Indica TODOS los requisitos que le faltan a la contraseña. */
public class PasswordSeguraValidator implements ConstraintValidator<PasswordSegura, String> {

    @Override
    public boolean isValid(String password, ConstraintValidatorContext context) {
        if (password == null || password.isEmpty()) {
            return true; // de esto se encarga @NotBlank
        }
        List<String> problemas = new ArrayList<>();
        if (password.length() < 8) {
            problemas.add("debe tener al menos 8 caracteres (tiene " + password.length() + ")");
        }
        if (password.length() > 60) {
            problemas.add("no puede superar los 60 caracteres (tiene " + password.length() + ")");
        }
        if (!password.matches(".*[A-Z].*")) {
            problemas.add("debe incluir al menos una letra MAYÚSCULA");
        }
        if (!password.matches(".*[a-z].*")) {
            problemas.add("debe incluir al menos una letra minúscula");
        }
        if (!password.matches(".*\\d.*")) {
            problemas.add("debe incluir al menos un número");
        }
        if (!password.matches(".*[^A-Za-z0-9\\s].*")) {
            problemas.add("debe incluir al menos un carácter especial (ej. * . # @ ! $)");
        }
        if (password.matches(".*\\s.*")) {
            problemas.add("no debe contener espacios");
        }
        if (problemas.isEmpty()) {
            return true;
        }
        context.disableDefaultConstraintViolation();
        context.buildConstraintViolationWithTemplate("La contraseña no es segura: " + String.join("; ", problemas))
                .addConstraintViolation();
        return false;
    }
}
