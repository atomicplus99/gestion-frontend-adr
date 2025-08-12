# Sistema de Gestión Académica - Andres de los Reyes

Sistema de gestión académica para control de asistencia de estudiantes y docentes.

## 🚀 **CONFIGURACIÓN AUTOMÁTICA - UN SOLO COMANDO**

### **🪟 Windows:**
```bash
# Ejecutar PowerShell como Administrador y ejecutar:
.\setup-windows.ps1
```

### **🐧 Linux (Ubuntu/Debian/CentOS):**
```bash
# Ejecutar como root:
sudo bash setup-linux.sh
```

## ✅ **¿Qué hace automáticamente?**

1. **📡 Actualiza IP del backend** (detecta automáticamente)
2. **🔨 Construye la aplicación Angular**
3. **📥 Instala Nginx** (descarga e instala)
4. **⚙️ Configura Nginx** (configuración completa)
5. **📋 Copia archivos** de la aplicación
6. **🚀 Inicia Nginx** automáticamente
7. **🌐 Aplica disponible** en http://localhost

## 📋 **Comandos de control (después de la instalación):**

### **🪟 Windows:**
- `start-nginx.bat` - Iniciar Nginx
- `stop-nginx.bat` - Detener Nginx
- `restart-nginx.bat` - Reiniciar Nginx

### **🐧 Linux:**
- `sudo systemctl start nginx` - Iniciar Nginx
- `sudo systemctl stop nginx` - Detener Nginx
- `sudo systemctl restart nginx` - Reiniciar Nginx

## 🔄 **Para actualizaciones futuras:**

```bash
# 1. Actualizar IP del backend
.\update-ip.ps1

# 2. Construir aplicación
npm run build

# 3. Reiniciar Nginx
# Windows: .\restart-nginx.bat
# Linux: sudo systemctl restart nginx
```

## 📅 **Fecha de Actualización**

**Última actualización:** 13/03/2025