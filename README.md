# sistema de gestion academica - andres de los reyes

sistema para control de asistencia de estudiantes y docentes

## configuracion automatica

### windows:
```bash
# abrir powershell como administrador y correr:
.\setup-windows.ps1
```

### linux (ubuntu/debian/centos):
```bash
# correr como root:
sudo bash setup-linux.sh
```

## que hace el script

1. actualiza ip del backend (detecta automaticamente)
2. construye la app angular
3. instala nginx 
4. configura nginx 
5. copia archivos de la app
6. inicia nginx 
7. deja la app disponible en http://localhost

## comandos de control

### windows:
- `start-nginx.bat` - iniciar nginx
- `stop-nginx.bat` - parar nginx
- `restart-nginx.bat` - reiniciar nginx

### linux:
- `sudo systemctl start nginx` - iniciar
- `sudo systemctl stop nginx` - parar
- `sudo systemctl restart nginx` - reiniciar

## para actualizar despues

```bash
# 1. actualizar ip
.\update-ip.ps1

# 2. hacer build
npm run build

# 3. reiniciar nginx
# windows: .\restart-nginx.bat
# linux: sudo systemctl restart nginx
```

## fecha de actualizacion

ultima actualizacion: 13/03/2025
