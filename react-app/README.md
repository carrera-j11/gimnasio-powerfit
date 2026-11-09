# PowerFit en React

Aplicación web en React que consume la API REST del gimnasio desarrollada con Spring Boot.

## Requisitos

- Node.js 20 o superior
- La API de Spring Boot en ejecución en `http://localhost:8080` (con MySQL activo)

## Configuración

La URL de la API está en el archivo `.env`:

```
VITE_API_URL=http://localhost:8080/api
```

La aplicación usa el puerto 5173 porque es el que la API permite en `app.cors.origenes`.

## Ejecución

```
npm install
npm run dev
```

Después abre `http://localhost:5173` e inicia sesión con una cuenta aprobada de la API.

Para generar la versión de producción: `npm run build`.

## Estructura

- `src/api/`: cliente HTTP y funciones de cada endpoint.
- `src/context/`: sesión del usuario y avisos.
- `src/hooks/`: `useConsulta`, que maneja cargando, datos y error.
- `src/components/`: menú, tablas, tarjetas, formularios, modales y estados.
- `src/pages/`: una página por cada recurso de la API.
- `evidencias/`: capturas del funcionamiento, hechas con datos de prueba ficticios.
