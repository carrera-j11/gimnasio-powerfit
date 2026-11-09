# Gimnasio PowerFit · Front-end Angular

Aplicación web en **Angular 22** que consume la API REST de **Spring Boot** (`../spring-boot-api`).
Permite consultar, registrar, modificar y eliminar la información de la base de datos MySQL a través de la API.

## Ejecutar

1. MySQL encendido y la API de Spring Boot ejecutándose (`GimnasioApiApplication.java`, puerto **8080**).
2. En esta carpeta:
   ```bash
   npm install      # solo la primera vez
   npm start        # = ng serve
   ```
3. Abrir **http://localhost:4200**

La única cuenta que existe al inicio es la del administrador: `admin@gimnasio.com` / `Admin123*`.

Para ingresar como socio, entrenador o recepcionista:
1. **Registrarse** con sus datos y el rol. Llega un código de 6 dígitos al correo.
2. El administrador entra a **Solicitudes**, escribe ese código y aprueba la cuenta.
3. La persona entra a **Iniciar sesión** con su correo y su contraseña.

> La URL de la API está en `src/environments/environment.ts`. La API ya permite el origen `http://localhost:4200` (CORS en `SecurityConfig`).

## Funcionalidades por rol

| Rol | Pantallas |
|---|---|
| Público | Inicio con planes y precios, registro, inicio de sesión, reenvío del código de verificación |
| ADMIN (hasta 3) | Panel, solicitudes de cuenta (aprobar/rechazar con el código), usuarios y personal, crear usuarios, planes (precio), entrenadores, socios, membresías, pagos, clases, inscripciones; puede eliminar. Las solicitudes de nuevos administradores solo las revisa el administrador principal |
| RECEPCIONISTA | Panel, socios y ficha del socio, membresías (crear, editar, cancelar), pagos (registrar, corregir), inscripciones, horario de clases e inscritos |
| ENTRENADOR | Panel, mis clases (crear, editar, eliminar), inscritos de sus clases, mi perfil |
| SOCIO | Panel, mi membresía (contratar un plan y pagarlo con tarjeta o transferencia), mis pagos, horario de clases (inscribirse / cancelar), mis inscripciones, mi perfil |

## Estructura

```
src/app
├── core
│   ├── models.ts                 → interfaces de los DTO de la API
│   ├── services
│   │   ├── auth.service.ts       → login, registro, sesión (token JWT en localStorage, cierre al expirar)
│   │   ├── api.services.ts       → un servicio por recurso: usuarios, planes, socios, entrenadores,
│   │   │                           membresías, pagos, clases, inscripciones
│   │   └── notificacion.service.ts → mensajes emergentes y confirmaciones
│   ├── interceptors.ts           → agrega "Authorization: Bearer <token>"; 401 cierra la sesión
│   └── guards.ts                 → authGuard (sesión), rolGuard (roles por ruta), invitadoGuard
├── layout/shell.ts               → menú lateral según el rol
├── shared                        → validadores (cédula, celular, contraseña…), modal, badges, pipes
└── features                      → una carpeta por módulo (publico, panel, admin, socios, membresias,
                                    pagos, clases, inscripciones, entrenadores, socio, perfil, errores)
```

## Comunicación con la API

- Cada pantalla llama a un servicio de `core/services`, que usa `HttpClient` contra `http://localhost:8080/api`.
- Los formularios validan lo mismo que la API (cédula ecuatoriana, celular 09XXXXXXXX, contraseña segura, edad mínima, horario de clases 06:00–22:00, etc.).
- Si la API responde con errores por campo (`errores: { campo: mensaje }`), se muestran debajo de cada campo.
- Si el token vence (1 hora) o la API responde 401, la sesión se cierra y se vuelve al login.
