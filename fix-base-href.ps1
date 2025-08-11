# Script para corregir el base href en Angular cuando se sirve desde una subcarpeta
# Uso: .\fix-base-href.ps1

Write-Host "Corrigiendo base href para Angular..." -ForegroundColor Cyan

# Ruta del archivo index.html
$indexFile = "dist\gestion-academico-andresdr\browser\index.html"

if (Test-Path $indexFile) {
    Write-Host "Archivo index.html encontrado" -ForegroundColor Green
    
    # Leer contenido del archivo
    $content = Get-Content $indexFile -Raw
    
    # Cambiar base href de "/" a "/browser/"
    $newContent = $content -replace '<base href="/">', '<base href="/browser/">'
    
    # Escribir el archivo actualizado
    Set-Content -Path $indexFile -Value $newContent -Encoding UTF8
    
    Write-Host "Base href corregido a '/browser/'" -ForegroundColor Green
    Write-Host "Ahora la aplicacion deberia funcionar correctamente" -ForegroundColor Green
    
} else {
    Write-Host "Archivo index.html no encontrado en: $indexFile" -ForegroundColor Red
    Write-Host "Verifica que el build se haya completado" -ForegroundColor Yellow
}
