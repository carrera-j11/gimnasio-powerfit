# Abre solo los puertos de la aplicación y solo para dispositivos de Tailscale.
# Ejecutar en PowerShell como administrador:
#   powershell -ExecutionPolicy Bypass -File despliegue\configurar-firewall.ps1
#   Agregue -CerrarMySQL para desactivar además las reglas que exponen la base de datos.
param([switch]$CerrarMySQL)
$ErrorActionPreference = 'Stop'

$principal = [Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw 'Este script debe ejecutarse como administrador.'
}
if (-not (Get-NetAdapter -Name 'Tailscale' -ErrorAction SilentlyContinue)) {
    throw 'No se encontró la interfaz Tailscale. Instale Tailscale e inicie sesión.'
}

# 100.64.0.0/10 es el rango de direcciones que usa Tailscale
foreach ($regla in @(@{ Nombre = 'PowerFit Web (Tailscale)'; Puerto = 4200 }, @{ Nombre = 'PowerFit API (Tailscale)'; Puerto = 8080 })) {
    Get-NetFirewallRule -DisplayName $regla.Nombre -ErrorAction SilentlyContinue | Remove-NetFirewallRule
    New-NetFirewallRule -DisplayName $regla.Nombre -Direction Inbound -Action Allow -Protocol TCP `
        -LocalPort $regla.Puerto -RemoteAddress 100.64.0.0/10 -InterfaceAlias 'Tailscale' -Profile Any | Out-Null
    Write-Host "Regla creada: $($regla.Nombre), puerto $($regla.Puerto)"
}

if ($CerrarMySQL) {
    # Solo se desactivan, así se pueden volver a activar con Enable-NetFirewallRule
    foreach ($nombre in 'Port 3306', 'Port 33060') {
        $regla = Get-NetFirewallRule -DisplayName $nombre -ErrorAction SilentlyContinue
        if ($regla) {
            $regla | Disable-NetFirewallRule
            Write-Host "Regla desactivada: $nombre"
        }
    }
}

Write-Host ''
Get-NetFirewallRule -Direction Inbound | Where-Object { $_.DisplayName -match 'PowerFit|^Port 3306|^Port 33060' } |
    Select-Object DisplayName, Enabled, Action | Format-Table -AutoSize
