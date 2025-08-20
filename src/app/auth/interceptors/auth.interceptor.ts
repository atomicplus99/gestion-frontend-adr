import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenService } from '../services/token.service';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const router = inject(Router);
  
  console.log('🔄 AuthInterceptor: Interceptando solicitud');
  console.log('📍 URL:', req.url);
  console.log('🔧 Método:', req.method);
  
  // Solo agregar token a URLs de la API interna
  const isInternalAPI = req.url.includes('localhost') || req.url.includes('192.168.1.108');
  console.log('🏠 Es API interna:', isInternalAPI);
  
  if (!isInternalAPI) {
    console.log('🌐 API externa detectada, enviando sin token');
    return next(req);
  }
  
  // Obtener el token válido SOLO para APIs internas (sin redirección automática)
  const token = tokenService.getStoredToken();
  const isTokenValid = token ? !tokenService.isTokenExpired(token) : false;
  console.log('🎫 Token disponible:', !!token);
  console.log('🎫 Token válido:', isTokenValid);
  
  
  if (token && isTokenValid) {
    console.log('🔐 Agregando token a la solicitud');
    
    // Verificar si el token está próximo a expirar
    const timeRemaining = tokenService.getTokenTimeRemaining(token);
    console.log('⏰ Tiempo restante del token (minutos):', timeRemaining);
    if (timeRemaining < 5) {
      console.warn('⚠️ Token próximo a expirar');
    }
    
    // Agregar headers de seguridad adicionales
    const authReq = req.clone({
      setHeaders: {
        'Authorization': `Bearer ${token}`,
        'X-Requested-With': 'XMLHttpRequest',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    console.log('✅ Solicitud modificada con headers de autenticación');
    return next(authReq);
  }
  
  // Si no hay token válido para API interna, continuar sin modificar
  if (!token) {
    console.log('❌ No hay token para API interna');
  } else if (!isTokenValid) {
    console.log('❌ Token expirado para API interna');
  }
  console.log('➡️ Enviando solicitud sin token');
  return next(req);
};
