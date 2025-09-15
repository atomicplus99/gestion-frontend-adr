# 🔧 Configuración de Environment

## ⚠️ IMPORTANTE: Seguridad

Los archivos `environment.ts` y `environment.prod.ts` contienen información sensible y **NO deben subirse a GitHub**.

## 📋 Configuración Inicial

### 1. Copiar archivos de ejemplo
```bash
cp src/environments/environment.example.ts src/environments/environment.ts
cp src/environments/environment.prod.example.ts src/environments/environment.prod.ts
```

### 2. Configurar variables de desarrollo (`environment.ts`)
```typescript
export const environment = {
  production: false,
  apiUrl: 'https://localhost:443', // Tu API local
  weatherApiKey: 'tu-clave-de-weather-api',
  openWeatherApiKey: 'tu-clave-de-openweather',
  newsApiKey: 'tu-clave-de-news-api',
  // ... otras configuraciones
};
```

### 3. Configurar variables de producción (`environment.prod.ts`)
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://tu-api-de-produccion.com',
  // Claves de API para servicios externos (usar variables de entorno en producción)
  weatherApiKey: process.env['WEATHER_API_KEY'] || 'tu-clave-real',
  openWeatherApiKey: process.env['OPENWEATHER_API_KEY'] || 'tu-clave-real',
  newsApiKey: process.env['NEWS_API_KEY'] || 'tu-clave-real',
  
  // APIs gratuitas que no requieren clave
  restCountriesApiUrl: 'https://restcountries.com/v3.1',
  holidaysApiUrl: 'https://date.nager.at/api/v3',
  worldTimeApiUrl: 'https://worldtimeapi.org/api'
};
```

## 🚀 Para Despliegue

### Variables de entorno en el servidor:
- `API_URL`: URL de tu API de producción
- `WEATHER_API_KEY`: Clave de Weather API
- `OPENWEATHER_API_KEY`: Clave de OpenWeather API
- `NEWS_API_KEY`: Clave de News API
- etc.

### ¿Cómo funciona Angular con environments?

**Desarrollo:**
```bash
ng serve  # Usa environment.ts
```

**Producción:**
```bash
ng build --configuration=production  # Usa environment.prod.ts
```

**Angular automáticamente:**
- ✅ En desarrollo: Carga `environment.ts`
- ✅ En producción: Carga `environment.prod.ts`
- ✅ Reemplaza `environment` en tiempo de compilación

### En tu servidor de producción, crear los archivos:
```bash
# Crear environment.prod.ts con las variables reales
echo "export const environment = {
  production: true,
  apiUrl: process.env.API_URL || 'https://tu-api.com',
  weatherApiKey: process.env.WEATHER_API_KEY,
  newsApiKey: process.env.NEWS_API_KEY
};" > src/environments/environment.prod.ts
```

## 🔒 Seguridad

- ✅ Los archivos `.example.ts` van a GitHub (sin datos sensibles)
- ❌ Los archivos reales `environment.ts` y `environment.prod.ts` NO van a GitHub
- 🔐 Usar variables de entorno en producción
- 🚫 Nunca hardcodear claves de API en el código

## 📝 Notas

- Los archivos de environment están en `.gitignore`
- Siempre usar `environment.apiUrl` en lugar de URLs hardcodeadas
- Para WebSocket, se convierte automáticamente: `https://` → `wss://`
