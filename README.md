# Sistema de Gestión Académica - Andres de los Reyes

Proyecto de innovación tecnológica y/o mejora

En este proyecto se realizará la implementación de un sistema de gestión académica que contiene los siguientes módulos o servicios:

1. **Gestión y control de asistencia** de estudiantes y docentes.

## 🚀 Flujo de Trabajo para Desarrollo

### **Paso 1: Actualizar IP del Backend**
Antes de cualquier operación, ejecuta el script para detectar y actualizar la IP de red local:

```bash
.\update-ip.ps1
```

Este script:
- Detecta automáticamente tu IP de red local
- Actualiza `src/environments/environment.ts` con la IP correcta
- Configura la URL del backend con HTTPS y puerto 30001

### **Paso 2: Construir la Aplicación**
Después de actualizar la IP, construye la aplicación:

```bash
npm run build
```

### **Paso 3: Lanzar el Servidor**
Finalmente, lanza el servidor en el puerto 4300:

```bash
ng serve --host 0.0.0.0 --port 4300
```

## 🔧 Configuración del Backend

- **Protocolo:** HTTPS
- **Puerto:** 30001
- **URL:** `https://[TU_IP_LOCAL]:30001`

## 📁 Estructura del Proyecto

```
src/
├── environments/
│   ├── environment.ts          # Configuración de desarrollo
│   └── environment.prod.ts     # Configuración de producción
├── app/
│   ├── auth/                   # Módulo de autenticación
│   ├── shared/                 # Componentes compartidos
│   └── core/                   # Servicios core
└── ...
```

## 🛠️ Scripts Disponibles

- **`update-ip.ps1`** - Detecta y actualiza la IP del backend
- **`start-production.ps1`** - Lanza la aplicación en modo producción
- **`start-production.bat`** - Versión batch para Windows

## 📅 Fecha de Actualización

**Última actualización:** 13/03/2025

---

**Nota importante:** Siempre ejecuta `update-ip.ps1` primero para asegurar que la aplicación se conecte al backend correcto.