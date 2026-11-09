// Sirve la versión compilada de Angular y reenvía /api a Spring Boot.
// Uso: node servir-angular.mjs <ip> <puerto> <puerto-api>
// Escucha en la IP de Tailscale y en 127.0.0.1 (la dirección que usa Tailscale Funnel).
// No escucha en la red Wi-Fi.
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer, request } from 'node:http';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const [ip, puerto = '4200', puertoApi = '8080'] = process.argv.slice(2);
if (!ip) {
  console.error('Falta la IP. Uso: node servir-angular.mjs <ip> <puerto> <puerto-api>');
  process.exit(1);
}

const carpeta = dirname(fileURLToPath(import.meta.url));
const raiz = resolve(carpeta, '../angular-app/dist/angular-app/browser');
const indice = join(raiz, 'index.html');
if (!existsSync(indice)) {
  console.error(`No existe ${indice}. Primero compile Angular.`);
  process.exit(1);
}

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

// Límite para login y registro: evita probar contraseñas o enviar correos sin control
const MAX_INTENTOS = 10;
const VENTANA_MS = 60_000;
const intentos = new Map();

function superaLimite(cliente) {
  const ahora = Date.now();
  const registro = intentos.get(cliente);
  if (!registro || ahora - registro.inicio > VENTANA_MS) {
    intentos.set(cliente, { inicio: ahora, total: 1 });
    return false;
  }
  registro.total += 1;
  return registro.total > MAX_INTENTOS;
}

setInterval(() => {
  const ahora = Date.now();
  for (const [cliente, registro] of intentos) {
    if (ahora - registro.inicio > VENTANA_MS) intentos.delete(cliente);
  }
}, VENTANA_MS).unref();

function responderJson(respuesta, status, mensaje) {
  respuesta.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  respuesta.end(JSON.stringify({ status, mensaje }));
}

function reenviarApi(peticion, respuesta) {
  // Funnel indica el cliente real en X-Forwarded-For; las demás conexiones se identifican por su IP
  const local = peticion.socket.remoteAddress === '127.0.0.1';
  const cliente = (local && peticion.headers['x-forwarded-for']?.split(',')[0].trim()) || peticion.socket.remoteAddress;
  if (peticion.method === 'POST' && peticion.url.startsWith('/api/auth/') && superaLimite(cliente)) {
    responderJson(respuesta, 429, 'Demasiados intentos. Espere un minuto y vuelva a intentarlo.');
    return;
  }

  const salida = request(
    { host: ip, port: Number(puertoApi), path: peticion.url, method: peticion.method, headers: peticion.headers },
    (entrada) => {
      respuesta.writeHead(entrada.statusCode, entrada.headers);
      entrada.pipe(respuesta);
    },
  );
  salida.on('error', () => responderJson(respuesta, 502, 'No se pudo conectar con la API.'));
  peticion.pipe(salida);
}

function enviar(respuesta, archivo) {
  respuesta.writeHead(200, {
    'Content-Type': TIPOS[extname(archivo)] ?? 'application/octet-stream',
    'X-Content-Type-Options': 'nosniff',
  });
  createReadStream(archivo).pipe(respuesta);
}

function atender(peticion, respuesta) {
  if (peticion.url === '/api' || peticion.url.startsWith('/api/')) {
    reenviarApi(peticion, respuesta);
    return;
  }
  if (peticion.method !== 'GET' && peticion.method !== 'HEAD') {
    respuesta.writeHead(405).end();
    return;
  }

  let ruta;
  try {
    ruta = decodeURIComponent(new URL(peticion.url, 'http://servidor').pathname);
  } catch {
    respuesta.writeHead(400).end();
    return;
  }

  // Impide salir de la carpeta del frontend con rutas como /../../archivo
  const archivo = resolve(raiz, `.${ruta}`);
  if (archivo !== raiz && !archivo.startsWith(raiz + sep)) {
    respuesta.writeHead(403).end();
    return;
  }

  if (existsSync(archivo) && statSync(archivo).isFile()) {
    enviar(respuesta, archivo);
  } else if (extname(ruta)) {
    respuesta.writeHead(404).end();
  } else {
    // Las rutas de Angular (/socios, /pagos...) las resuelve index.html en el navegador
    enviar(respuesta, indice);
  }
}

for (const direccion of new Set([ip, '127.0.0.1'])) {
  createServer(atender).listen(Number(puerto), direccion, () => {
    console.log(`Frontend disponible en http://${direccion}:${puerto}`);
  });
}
