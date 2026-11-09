# Gimnasio PowerFit · API REST con Node.js + Express

Misma API que la versión de Spring Boot (mismas rutas, JSON, roles y reglas), hecha con **Node.js, Express 5, Sequelize (MySQL), JWT, bcrypt, express-validator y nodemailer**.

## 1. Ejecutar

1. Configure el archivo `.env`:
   ```env
   DB_PASSWORD=su_contraseña_de_mysql
   SMTP_USER=sucorreo@gmail.com
   SMTP_PASS=contraseña_de_aplicacion
   ```
2. En esta carpeta:
   ```bash
   npm install
   npm run dev
   ```
3. Se crean solos: la base `gimnasio_node_db`, las tablas, los **3 planes** y el **ADMIN** (`admin@gimnasio.com` / `Admin123*`). La API queda en `http://localhost:3000`.

> El código de verificación llega al correo que cada persona escribe al registrarse.
> Plan B si la red bloquea el correo: `MOSTRAR_CODIGO_EN_CONSOLA=true` muestra el código en la consola.

## 2. Middlewares

```
Petición ─► cors ─► jsonRequerido ─► express.json ─► verificarToken ─► permitirRoles ─► validaciones ─► validar ─► controlador
                         415              400              401               403                         400
```

| Middleware | Archivo | Función |
|---|---|---|
| `cors` | `app.js` | Permite que React (5173) y Angular (4200) consuman la API |
| `jsonRequerido` | `middlewares/jsonRequerido.js` | 415 si el cuerpo no es JSON |
| `verificarToken` | `middlewares/auth.js` | Valida el JWT y que la cuenta siga APROBADA; guarda `req.usuario` |
| `permitirRoles(...)` | `middlewares/auth.js` | 403 si el rol no está permitido |
| `validar` | `middlewares/validar.js` | 400 con un mensaje por campo (express-validator) |
| `errorHandler` | `middlewares/errorHandler.js` | Convierte cualquier error en el JSON estándar |

## 3. Estructura

```
src
├── server.js       → Crea la BD, sincroniza tablas, crea planes y ADMIN, levanta el servidor
├── app.js          → Express, CORS, rutas y manejo de errores
├── config          → Conexión Sequelize
├── models          → 8 modelos y sus relaciones (index.js)
├── routes          → Endpoints con sus middlewares de seguridad y validación
├── validators      → Reglas de express-validator
├── controllers     → Lógica y reglas de negocio
└── utils           → AppError, correo, cédula, fechas, respuestas
```

## 4. Equivalencias con Spring Boot

| Spring Boot | Node.js + Express |
|---|---|
| `@Entity` + JPA | Modelo de Sequelize |
| `@OneToOne` / `@ManyToOne` | `hasOne` / `hasMany` + `belongsTo` |
| `@Valid` + DTO | express-validator + `validar` |
| `JwtAuthenticationFilter` | `verificarToken` |
| `@PreAuthorize("hasRole(...)")` | `permitirRoles(...)` |
| `@RestControllerAdvice` | `errorHandler` |
| `BCryptPasswordEncoder` | bcryptjs |
| `JavaMailSender` | nodemailer |
| `application.properties` | `.env` |

El detalle de entidades, flujo de verificación, permisos y reglas está en el README de `spring-boot-api` (son idénticos). Las validaciones con mensajes detallados (celular, contraseña, código) están en `src/validators/comunes.js`.
