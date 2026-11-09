# Despliegue con Tailscale

## Requisitos

- MySQL activo, Java, Node.js y Tailscale con la sesión iniciada.

## Primera vez

En PowerShell como administrador:

```
powershell -ExecutionPolicy Bypass -File despliegue\configurar-firewall.ps1 -CerrarMySQL
```

Crea las reglas de los puertos 4200 y 8080 solo para Tailscale y desactiva las reglas que exponían MySQL.

## Iniciar los servicios

```
powershell -ExecutionPolicy Bypass -File despliegue\iniciar-servidor.ps1
```

Agregue `-SinCompilar` para usar la última compilación. Para detener los servicios, cierre las ventanas "PowerFit API" y "PowerFit Web".

## Direcciones

- VPN: `http://<IP de Tailscale>:4200`
- Público, con Funnel activo: `https://carrera.tailbc1073.ts.net`

## Acceso público

```
tailscale funnel --bg 4200     # activar
tailscale funnel status        # consultar
tailscale funnel reset         # cerrar
```

Mientras esté activo, cualquier persona con el enlace puede abrir la aplicación. Ciérrelo al terminar.
