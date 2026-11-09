// Genera src/environments/environment.production.ts a partir de la variable de entorno API_URL.
// Vercel la define en Settings > Environment Variables, así la URL de la API no queda fija en el código.
import { writeFileSync } from 'node:fs';

const apiUrl = (process.env.API_URL || '').trim().replace(/\/+$/, '');

if (!apiUrl) {
  console.error('Falta la variable de entorno API_URL (ej.: https://mi-api.up.railway.app/api)');
  process.exit(1);
}
if (!apiUrl.startsWith('https://')) {
  console.error(`API_URL debe usar HTTPS en producción. Valor recibido: ${apiUrl}`);
  process.exit(1);
}

const contenido = `// Archivo generado por scripts/generar-environment.mjs. No editar a mano.
export const environment = {
  apiUrl: '${apiUrl}',
};
`;
writeFileSync('src/environments/environment.production.ts', contenido);
console.log(`environment.production.ts generado con apiUrl = ${apiUrl}`);
