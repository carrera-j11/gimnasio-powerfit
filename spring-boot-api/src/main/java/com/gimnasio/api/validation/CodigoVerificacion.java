package com.gimnasio.api.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/** Código de verificación: exactamente 6 dígitos numéricos. */
@Documented
@Constraint(validatedBy = CodigoVerificacionValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface CodigoVerificacion {

    String message() default "El código de verificación no es válido";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
