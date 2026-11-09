# Gimnasio PowerFit – Aplicación Full Stack

| Componente | Carpeta | Tecnología | Despliegue |
|---|---|---|---|
| Front-end | `angular-app/` | Angular 22 | Vercel |
| API REST | `spring-boot-api/` | Java 21 + Spring Boot 3.5 | Railway (Dockerfile) |
| Base de datos | — | MySQL 8 | Railway (servicio MySQL) |

Otras carpetas de bloques anteriores: `react-app/`, `node-express-api/`, `postman/`, `despliegue/` (Tailscale).

## Desarrollo local

```bash
# API (requiere MySQL en localhost:3306)
cd spring-boot-api
cp src/main/resources/secretos-local.properties.example src/main/resources/secretos-local.properties  # complete los valores
./mvnw spring-boot:run

# Front-end
cd angular-app
npm install
npm start          # http://localhost:4200 -> usa http://localhost:8080/api
```

## Variables de entorno de producción

### Railway – servicio `spring-boot-api` (Root Directory: `/spring-boot-api`)

| Variable | Valor |
|---|---|
| `DB_URL` | `jdbc:mysql://${{MySQL.MYSQLHOST}}:${{MySQL.MYSQLPORT}}/${{MySQL.MYSQLDATABASE}}?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=America/Guayaquil` |
| `DB_USER` | `${{MySQL.MYSQLUSER}}` |
| `DB_PASSWORD` | `${{MySQL.MYSQLPASSWORD}}` |
| `JWT_SECRET` | Clave Base64 aleatoria (≥ 32 bytes) |
| `ADMIN_PASSWORD` | Contraseña del administrador inicial |
| `CORS_ORIGENES` | `https://<proyecto>.vercel.app` |
| `MOSTRAR_CODIGO_EN_CONSOLA` | `true` (el código de verificación se ve en los logs) |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | Opcional: credenciales SMTP |

`PORT` lo define Railway automáticamente.

### Vercel – proyecto `angular-app` (Root Directory: `angular-app`)

| Variable | Valor |
|---|---|
| `API_URL` | `https://<servicio>.up.railway.app/api` |

`vercel.json` ejecuta `npm run build:vercel`, que genera `environment.production.ts` con `API_URL` y compila Angular.
