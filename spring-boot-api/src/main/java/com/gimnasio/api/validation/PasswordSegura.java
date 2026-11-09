package com.gimnasio.api.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/** Contraseña segura: 8 a 60 caracteres, mayúscula, minúscula, número y carácter especial, sin espacios. */
@Documented
@Constraint(validatedBy = PasswordSeguraValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface PasswordSegura {

    String message() default "La contraseña no es segura";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
