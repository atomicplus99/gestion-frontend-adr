# Script automatico para Windows - Instala Nginx y despliega la aplicacion
# Uso: .\setup-windows.ps1

Write-Host "Configuracion automatica para Windows..." -ForegroundColor Green

# Verificar si se ejecuta como administrador
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "Este script debe ejecutarse como Administrador" -ForegroundColor Red
    Write-Host "Cierra PowerShell y ejecutalo como Administrador" -ForegroundColor Yellow
    pause
    exit
}

# Paso 1: Actualizar IP del backend
Write-Host "Paso 1: Actualizando IP del backend..." -ForegroundColor Cyan
.\update-ip.ps1

# Paso 2: Construir la aplicacion
Write-Host "Paso 2: Construyendo aplicacion Angular..." -ForegroundColor Cyan
npm run build

# Paso 3: Descargar e instalar Nginx
Write-Host "Paso 3: Descargando Nginx..." -ForegroundColor Cyan
$nginxDir = "C:\nginx"
$nginxUrl = "http://nginx.org/download/nginx-1.24.0.zip"
$zipPath = "$env:TEMP\nginx.zip"

# Crear directorio
if (!(Test-Path $nginxDir)) {
    New-Item -ItemType Directory -Path $nginxDir -Force
}

# Descargar Nginx
Invoke-WebRequest -Uri $nginxUrl -OutFile $zipPath
Write-Host "Nginx descargado" -ForegroundColor Green

# Extraer archivos
Write-Host "Extrayendo Nginx..." -ForegroundColor Cyan
Expand-Archive -Path $zipPath -DestinationPath $nginxDir -Force

# Mover archivos de la subcarpeta
$subDir = Get-ChildItem -Path $nginxDir -Directory | Where-Object { $_.Name -like "nginx-*" } | Select-Object -First 1
if ($subDir) {
    Get-ChildItem -Path $subDir.FullName | Move-Item -Destination $nginxDir -Force
    Remove-Item $subDir.FullName -Force
}

# Crear directorios necesarios
New-Item -ItemType Directory -Path "$nginxDir\logs" -Force
New-Item -ItemType Directory -Path "$nginxDir\conf" -Force

# Paso 4: Crear configuracion de Nginx
Write-Host "Paso 4: Configurando Nginx..." -ForegroundColor Cyan

# Crear mime.types basico
$mimeTypes = @"
types {
    text/html html htm shtml;
    text/css css;
    text/xml xml;
    image/gif gif;
    image/jpeg jpeg jpg;
    application/javascript js;
    image/png png;
    image/svg+xml svg svgz;
    application/font-woff woff;
    application/font-woff2 woff2;
    application/json json;
}
"@

Set-Content -Path "$nginxDir\conf\mime.types" -Value $mimeTypes -Encoding ASCII

# Crear nginx.conf
$nginxConfig = @"
worker_processes 1;

events {
    worker_connections 1024;
}

http {
    include mime.types;
    default_type application/octet-stream;
    
    access_log logs/access.log;
    error_log logs/error.log;
    
    gzip on;
    gzip_types text/plain text/css text/javascript application/javascript application/json;
    
    server {
        listen 80;
        server_name localhost;
        
        location / {
            root dist/browser;
            try_files `$uri `$uri/ /index.html;
            
            add_header X-Frame-Options "SAMEORIGIN" always;
            add_header X-Content-Type-Options "nosniff" always;
            add_header X-XSS-Protection "1; mode=block" always;
        }
        
        location /auth/ {
            proxy_pass https://192.168.1.108:30000/auth/;
            proxy_set_header Host `$host;
            proxy_set_header X-Real-IP `$remote_addr;
            proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        }
        
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            root dist/browser;
            expires 1y;
        }
        
        error_page 404 /index.html;
    }
}
"@

Set-Content -Path "$nginxDir\conf\nginx.conf" -Value $nginxConfig -Encoding ASCII

# Paso 5: Copiar archivos de la aplicacion
Write-Host "Paso 5: Copiando archivos de la aplicacion..." -ForegroundColor Cyan
Copy-Item "dist\*" "$nginxDir\dist\" -Recurse -Force

# Paso 6: Crear scripts de control
Write-Host "Paso 6: Creando scripts de control..." -ForegroundColor Cyan

$startScript = @"
@echo off
cd /d $nginxDir
start nginx.exe
echo Nginx iniciado en http://localhost
pause
"@

Set-Content -Path "start-nginx.bat" -Value $startScript -Encoding ASCII

$stopScript = @"
@echo off
cd /d $nginxDir
nginx.exe -s stop
echo Nginx detenido
pause
"@

Set-Content -Path "stop-nginx.bat" -Value $stopScript -Encoding ASCII

$restartScript = @"
@echo off
cd /d $nginxDir
nginx.exe -s stop
timeout /t 2 /nobreak >nul
start nginx.exe
echo Nginx reiniciado
pause
"@

Set-Content -Path "restart-nginx.bat" -Value $restartScript -Encoding ASCII

# Paso 7: Probar configuracion
Write-Host "Paso 7: Probando configuracion..." -ForegroundColor Cyan
Set-Location $nginxDir
$testResult = .\nginx.exe -t 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "Configuracion valida" -ForegroundColor Green
    
    # Paso 8: Iniciar Nginx
    Write-Host "Paso 8: Iniciando Nginx..." -ForegroundColor Cyan
    Start-Process -FilePath ".\nginx.exe"
    
    # Limpiar archivo temporal
    Remove-Item $zipPath -Force -ErrorAction SilentlyContinue
    
    Write-Host ""
    Write-Host "CONFIGURACION COMPLETADA EXITOSAMENTE!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Tu aplicacion esta disponible en:" -ForegroundColor Cyan
    Write-Host "  http://localhost" -ForegroundColor White
    Write-Host "  http://192.168.1.108" -ForegroundColor White
    Write-Host ""
    Write-Host "Comandos disponibles:" -ForegroundColor Cyan
    Write-Host "  start-nginx.bat     - Iniciar Nginx" -ForegroundColor White
    Write-Host "  stop-nginx.bat      - Detener Nginx" -ForegroundColor White
    Write-Host "  restart-nginx.bat   - Reiniciar Nginx" -ForegroundColor White
    Write-Host ""
    Write-Host "Nginx se inicio automaticamente" -ForegroundColor Green
    
} else {
    Write-Host "Error en la configuracion:" -ForegroundColor Red
    Write-Host $testResult -ForegroundColor Red
}

pause
