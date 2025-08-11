# Script para iniciar la aplicación Angular en producción usando http-server
# Uso: .\start-production.ps1

Write-Host "Iniciando aplicacion Angular en produccion..." -ForegroundColor Cyan

# Verificar si existe la carpeta dist
$distPath = "dist\gestion-academico-andresdr"
if (-not (Test-Path $distPath)) {
    Write-Host "Carpeta dist no encontrada. Ejecutando build..." -ForegroundColor Red
    Write-Host "Ejecutando npm run build..." -ForegroundColor Yellow
    
    npm run build
    
    if (-not (Test-Path $distPath)) {
        Write-Host "Error en el build. Verifica los errores." -ForegroundColor Red
        exit 1
    }
}

Write-Host "Build encontrado en: $distPath" -ForegroundColor Green

# Verificar si existe la carpeta browser (Angular 17+)
$browserPath = "$distPath\browser"
if (Test-Path $browserPath) {
    Write-Host "Carpeta browser encontrada. Sirviendo desde la raiz..." -ForegroundColor Green
    
    # Crear un archivo index.html temporal en la raíz que redirija a /browser/
    $redirectHtml = @"
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Redirigiendo...</title>
    <script>
        window.location.href = '/browser/';
    </script>
</head>
<body>
    <p>Redirigiendo a la aplicación...</p>
</body>
</html>
"@
    
    Set-Content -Path "$distPath\index.html" -Value $redirectHtml -Encoding UTF8
    Write-Host "Archivo de redireccion creado en la raiz" -ForegroundColor Green
}

# Verificar si http-server está instalado
try {
    $null = Get-Command http-server -ErrorAction Stop
    Write-Host "http-server encontrado" -ForegroundColor Green
} catch {
    Write-Host "http-server no encontrado. Instalando..." -ForegroundColor Yellow
    npm install -g http-server
}

# Detectar IP local para mostrar en la consola
$localIP = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.IPAddress -match '^192\.168\.' -or
    $_.IPAddress -match '^10\.' -or
    ($_.IPAddress -match '^172\.' -and [int]($_.IPAddress -split '\.')[1] -ge 16 -and [int]($_.IPAddress -split '\.')[1] -le 31)
} | Select-Object -First 1 -ExpandProperty IPAddress

if (-not $localIP) {
    $localIP = "localhost"
}

Write-Host "Servidor iniciado en:" -ForegroundColor Green
Write-Host " Local: http://localhost:8080" -ForegroundColor Cyan
Write-Host " Red local: http://${localIP}:8080" -ForegroundColor Cyan
Write-Host " Backend API: http://${localIP}:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "La aplicacion se abrira automaticamente en el navegador" -ForegroundColor Yellow
Write-Host "Presiona Ctrl+C para detener el servidor" -ForegroundColor Red

# Iniciar http-server desde la raíz del dist
cd $distPath
http-server -p 8080 -a 0.0.0.0 -o --cors
