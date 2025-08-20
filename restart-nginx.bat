@echo off
cd /d C:\nginx
nginx.exe -s stop
timeout /t 2 /nobreak >nul
start nginx.exe
echo Nginx reiniciado
pause
