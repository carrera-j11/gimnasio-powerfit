package com.gimnasio.api.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Anotación personalizada que valida una cédula ecuatoriana:
 * 10 dígitos, código de provincia válido y dígito verificador (módulo 10).
 */
@Documented
@Constraint(validatedBy = CedulaValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface Cedula {

    String message() default "La cédula ingresada no es válida";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
