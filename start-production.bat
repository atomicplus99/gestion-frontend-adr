@echo off
chcp 65001 >nul
echo Iniciando aplicacion Angular en produccion...

REM Verificar si existe la carpeta dist
if not exist "dist\gestion-academico-andresdr" (
    echo Carpeta dist no encontrada. Ejecutando build...
    echo Ejecutando npm run build...
    npm run build
    
    if not exist "dist\gestion-academico-andresdr" (
        echo Error en el build. Verifica los errores.
        pause
        exit /b 1
    )
)

echo Build encontrado
echo URLs de acceso:
echo   Local: http://localhost:8080
echo   Red local: http://192.168.1.108:8080
echo   Backend API: http://192.168.1.108:3000
echo.
echo Serviendo desde: dist\gestion-academico-andresdr
echo Presiona Ctrl+C para detener el servidor
echo.

cd dist\gestion-academico-andresdr
http-server -p 8080 -a 0.0.0.0 -o --cors

pause
