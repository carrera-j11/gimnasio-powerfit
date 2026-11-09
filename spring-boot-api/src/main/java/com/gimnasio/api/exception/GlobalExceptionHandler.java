package com.gimnasio.api.exception;

import com.fasterxml.jackson.core.JsonParseException;
import com.fasterxml.jackson.databind.exc.InvalidFormatException;
import com.fasterxml.jackson.databind.exc.MismatchedInputException;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Captura todas las excepciones de la API y las convierte en
 * respuestas JSON claras con el código HTTP correcto.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // 404 - Registro no encontrado
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> manejarNoEncontrado(ResourceNotFoundException ex, HttpServletRequest request) {
        return construir(HttpStatus.NOT_FOUND, ex.getMessage(), request, null);
    }

    // 409 - Dato duplicado (cédula, email, etc.)
    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ErrorResponse> manejarDuplicado(DuplicateResourceException ex, HttpServletRequest request) {
        return construir(HttpStatus.CONFLICT, ex.getMessage(), request, null);
    }

    // 401 - Login con email o contraseña incorrectos
    @ExceptionHandler(CredencialesInvalidasException.class)
    public ResponseEntity<ErrorResponse> manejarCredenciales(CredencialesInvalidasException ex, HttpServletRequest request) {
        return construir(HttpStatus.UNAUTHORIZED, ex.getMessage(), request, null);
    }

    // 403 - Cuenta sin verificar, pendiente de aprobación o rechazada
    @ExceptionHandler(CuentaNoHabilitadaException.class)
    public ResponseEntity<ErrorResponse> manejarCuentaNoHabilitada(CuentaNoHabilitadaException ex, HttpServletRequest request) {
        return construir(HttpStatus.FORBIDDEN, ex.getMessage(), request, null);
    }

    // 403 - Intenta acceder a datos de otra persona (ej. un socio viendo pagos ajenos)
    @ExceptionHandler(AccesoDenegadoException.class)
    public ResponseEntity<ErrorResponse> manejarAccesoDenegado(AccesoDenegadoException ex, HttpServletRequest request) {
        return construir(HttpStatus.FORBIDDEN, ex.getMessage(), request, null);
    }

    // 403 - El rol no tiene permiso (@PreAuthorize en los controladores)
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> manejarSinPermiso(AccessDeniedException ex, HttpServletRequest request) {
        return construir(HttpStatus.FORBIDDEN, "No tiene permisos para realizar esta acción con su rol", request, null);
    }

    // 503 - Falló el envío del correo
    @ExceptionHandler(EmailException.class)
    public ResponseEntity<ErrorResponse> manejarEmail(EmailException ex, HttpServletRequest request) {
        return construir(HttpStatus.SERVICE_UNAVAILABLE, ex.getMessage(), request, null);
    }

    // 400 - Regla de negocio incumplida
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> manejarNegocio(BusinessException ex, HttpServletRequest request) {
        return construir(HttpStatus.BAD_REQUEST, ex.getMessage(), request, null);
    }

    // 400 - Errores de las anotaciones @NotBlank, @Pattern, @Cedula, etc.
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> manejarValidaciones(MethodArgumentNotValidException ex, HttpServletRequest request) {
        Map<String, String> errores = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(e -> errores.putIfAbsent(e.getField(), e.getDefaultMessage()));
        return construir(HttpStatus.BAD_REQUEST, "Hay errores de validación en los datos enviados", request, errores);
    }

    // 400 - JSON mal escrito, fecha/hora con formato incorrecto, texto donde va un número
    //       o valor que no existe en una lista (ej. metodoPago = "EFECTIVOO")
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> manejarJsonInvalido(HttpMessageNotReadableException ex, HttpServletRequest request) {
        Throwable causa = ex.getCause();

        // Un campo tiene un valor con formato o tipo incorrecto
        if (causa instanceof InvalidFormatException ife && !ife.getPath().isEmpty()) {
            String campo = ife.getPath().get(ife.getPath().size() - 1).getFieldName();
            Class<?> tipo = ife.getTargetType();
            Object valor = ife.getValue();
            String detalle;

            if (tipo.isEnum()) {
                detalle = "El valor '" + valor + "' no es válido. Valores permitidos: "
                        + Arrays.toString(tipo.getEnumConstants());
            } else if (tipo == LocalDate.class) {
                detalle = "La fecha '" + valor + "' no es válida. Use el formato yyyy-MM-dd (ej. 2002-05-14)";
            } else if (tipo == LocalTime.class) {
                detalle = "La hora '" + valor + "' no es válida. Use el formato HH:mm (ej. 07:30)";
            } else if (Number.class.isAssignableFrom(tipo) || tipo.isPrimitive()) {
                detalle = "El valor '" + valor + "' no es un número válido";
            } else {
                detalle = "El valor '" + valor + "' no es válido";
            }
            return construir(HttpStatus.BAD_REQUEST, "Hay datos con formato inválido", request, Map.of(campo, detalle));
        }

        // El JSON está mal escrito (falta una coma, una comilla, una llave...)
        if (causa instanceof JsonParseException) {
            return construir(HttpStatus.BAD_REQUEST,
                    "El JSON está mal escrito. Revise comas, comillas y llaves", request, null);
        }

        // Tipo de dato incorrecto (ej. se envía un objeto o una lista donde va un texto)
        if (causa instanceof MismatchedInputException mie && !mie.getPath().isEmpty()) {
            String campo = mie.getPath().get(mie.getPath().size() - 1).getFieldName();
            return construir(HttpStatus.BAD_REQUEST, "Hay datos con formato inválido", request,
                    Map.of(campo, "El tipo de dato enviado no es el correcto"));
        }

        // No se envió el cuerpo de la petición
        if (ex.getMessage() != null && ex.getMessage().contains("Required request body is missing")) {
            return construir(HttpStatus.BAD_REQUEST,
                    "Debe enviar los datos en el cuerpo de la petición en formato JSON", request, null);
        }

        return construir(HttpStatus.BAD_REQUEST, "El cuerpo de la petición tiene un formato inválido", request, null);
    }

    // 400 - Ej: /api/socios/abc cuando se espera un número
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> manejarTipoInvalido(MethodArgumentTypeMismatchException ex, HttpServletRequest request) {
        String mensaje = String.format("El parámetro '%s' tiene un valor inválido: '%s'", ex.getName(), ex.getValue());
        return construir(HttpStatus.BAD_REQUEST, mensaje, request, null);
    }

    // 404 - URL que no existe
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorResponse> manejarRutaInexistente(NoResourceFoundException ex, HttpServletRequest request) {
        return construir(HttpStatus.NOT_FOUND, "La ruta solicitada no existe", request, null);
    }

    // 405 - Método HTTP no permitido (ej. PUT donde solo hay GET)
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponse> manejarMetodoNoPermitido(HttpRequestMethodNotSupportedException ex, HttpServletRequest request) {
        return construir(HttpStatus.METHOD_NOT_ALLOWED, "El método " + ex.getMethod() + " no está permitido en esta ruta", request, null);
    }

    // 415 - Los datos no se enviaron como JSON (ej. en Postman quedó seleccionado "Text")
    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ErrorResponse> manejarTipoContenido(HttpMediaTypeNotSupportedException ex, HttpServletRequest request) {
        String recibido = ex.getContentType() != null ? ex.getContentType().toString() : "desconocido";
        return construir(HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                "Los datos deben enviarse en formato JSON (Content-Type: application/json). Se recibió: " + recibido,
                request, null);
    }

    // 409 - Restricciones de la BD (llaves foráneas, únicos)
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> manejarIntegridad(DataIntegrityViolationException ex, HttpServletRequest request) {
        return construir(HttpStatus.CONFLICT,
                "La operación viola una restricción de la base de datos (dato duplicado o registro relacionado)",
                request, null);
    }

    // 500 - Cualquier otro error inesperado
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> manejarGeneral(Exception ex, HttpServletRequest request) {
        log.error("Error inesperado", ex);
        return construir(HttpStatus.INTERNAL_SERVER_ERROR, "Ocurrió un error interno en el servidor", request, null);
    }

    private ResponseEntity<ErrorResponse> construir(HttpStatus status, String mensaje,
                                                    HttpServletRequest request, Map<String, String> errores) {
        ErrorResponse body = new ErrorResponse(
                LocalDateTime.now(),
                status.value(),
                status.getReasonPhrase(),
                mensaje,
                request.getRequestURI(),
                errores
        );
        return ResponseEntity.status(status).body(body);
    }
}
