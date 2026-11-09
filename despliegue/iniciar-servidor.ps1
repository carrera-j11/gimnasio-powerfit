# Compila e inicia el backend y el frontend usando la IP de Tailscale del servidor.
# Uso: powershell -ExecutionPolicy Bypass -File despliegue\iniciar-servidor.ps1
param(
    [string]$Ip,               # Si no se indica, se obtiene de Tailscale
    [switch]$SinCompilar       # Usa la última compilación
)
$ErrorActionPreference = 'Stop'
$raiz = Split-Path $PSScriptRoot -Parent

if (-not $Ip) {
    $tailscale = 'C:\Program Files\Tailscale\tailscale.exe'
    if (-not (Test-Path $tailscale)) { throw 'Tailscale no está instalado.' }
    $Ip = (& $tailscale ip -4 | Select-Object -First 1)
    if (-not $Ip) { throw 'Tailscale no tiene IP. Inicie sesión en Tailscale.' }
}
Write-Host "IP del servidor: $Ip"

# Dirección pública de Tailscale Funnel. Solo funciona si Funnel está activado.
$urlPublica = 'https://servidor.invalid'
$tailscaleExe = 'C:\Program Files\Tailscale\tailscale.exe'
if (Test-Path $tailscaleExe) {
    $nombreDns = (& $tailscaleExe status --json | ConvertFrom-Json).Self.DNSName
    if ($nombreDns) { $urlPublica = 'https://' + $nombreDns.TrimEnd('.') }
}

# 1. Por la VPN, el frontend llama a la API por la IP de Tailscale.
#    Por Funnel usa /api, que servir-angular.mjs reenvía a Spring Boot.
$ambiente = "// Archivo generado por despliegue/iniciar-servidor.ps1`nexport const environment = {`n  apiUrl: window.location.hostname === '${Ip}' ? 'http://${Ip}:8080/api' : '/api',`n};`n"
[IO.File]::WriteAllText("$raiz\angular-app\src\environments\environment.tailscale.ts", $ambiente)

if (-not $SinCompilar) {
    Write-Host 'Compilando Angular...'
    Push-Location "$raiz\angular-app"
    & npx.cmd ng build --configuration tailscale
    if ($LASTEXITCODE -ne 0) { Pop-Location; throw 'Falló la compilación de Angular.' }
    Pop-Location

    Write-Host 'Compilando Spring Boot...'
    Push-Location "$raiz\spring-boot-api"
    & .\mvnw.cmd -q -DskipTests package
    if ($LASTEXITCODE -ne 0) { Pop-Location; throw 'Falló la compilación de Spring Boot.' }
    Pop-Location
}

# 2. Cada servicio se abre en su propia ventana para poder ver sus mensajes
$jar = Get-ChildItem "$raiz\spring-boot-api\target\gimnasio-api-*.jar" | Where-Object Name -notmatch 'original' | Select-Object -First 1
if (-not $jar) { throw 'No se encontró el .jar de la API.' }

$comandoApi = "`$env:TAILSCALE_IP='$Ip'; `$env:TAILSCALE_URL_PUBLICA='$urlPublica'; `$Host.UI.RawUI.WindowTitle='PowerFit API'; java -jar '$($jar.FullName)' --spring.profiles.active=tailscale"
$comandoWeb = "`$Host.UI.RawUI.WindowTitle='PowerFit Web'; node '$PSScriptRoot\servir-angular.mjs' $Ip 4200 8080"
Start-Process powershell -ArgumentList '-NoExit', '-Command', $comandoApi
Start-Process powershell -ArgumentList '-NoExit', '-Command', $comandoWeb

Write-Host ''
Write-Host "Frontend: http://${Ip}:4200"
Write-Host "API:      http://${Ip}:8080/api"
Write-Host 'Para detener los servicios, cierre las dos ventanas.'
