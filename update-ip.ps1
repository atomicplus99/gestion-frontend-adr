# Script para detectar IP de red local y actualizar environment.ts
# Uso: .\update-ip.ps1

Write-Host "Detectando IP de red local..." -ForegroundColor Green

# Obtener IP de red local (solo IPs privadas, excluyendo enlace local y localhost)
$localIP = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.IPAddress -match '^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)' -and
    $_.InterfaceAlias -notmatch 'Loopback|Pseudo|Tunnel'
} | Select-Object -First 1 -ExpandProperty IPAddress

if ($localIP) {
    Write-Host "IP de red local detectada: $localIP" -ForegroundColor Green
    
    # Ruta del archivo environment.ts
    $envFile = "src/environments/environment.ts"
    
    if (Test-Path $envFile) {
        # Leer contenido del archivo
        $content = Get-Content $envFile -Raw
        
        # Reemplazar cualquier URL en el archivo con la nueva IP detectada
        # Actualiza IP y puerto a 30001
        $newContent = $content -replace 'https?://[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}:[0-9]+', "https://${localIP}:30001"
        
        # Escribir el archivo actualizado
        Set-Content -Path $envFile -Value $newContent -Encoding UTF8
        
        Write-Host "Archivo $envFile actualizado con IP: $localIP" -ForegroundColor Green
        Write-Host "Nueva URL del backend: https://${localIP}:30001" -ForegroundColor Cyan
    } else {
        Write-Host "Archivo $envFile no encontrado" -ForegroundColor Red
    }
} else {
    Write-Host "No se pudo detectar la IP de red local" -ForegroundColor Red
    Write-Host "Verificando todas las interfaces disponibles..." -ForegroundColor Yellow
    
    # Mostrar todas las IPs disponibles para debug
    Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
        $_.IPAddress -notmatch '^127\.|^169\.254\.|^::1$'
    } | ForEach-Object {
        Write-Host "  Interface: $($_.InterfaceAlias) - IP: $($_.IPAddress)" -ForegroundColor White
    }
}
