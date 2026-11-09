package com.gimnasio.api.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/** Celular de Ecuador: solo números, debe empezar con 09 y tener exactamente 10 dígitos. */
@Documented
@Constraint(validatedBy = CelularValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface Celular {

    String message() default "El número de celular no es válido";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
