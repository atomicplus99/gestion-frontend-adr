import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenService } from '../services/token.service';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const router = inject(Router);
  
  console.log('🔍 ===== AUTH INTERCEPTOR EJECUTÁNDOSE =====');
  console.log('🔍 URL de la petición:', req.url);
  console.log('🔍 Método HTTP:', req.method);
  console.log('🔍 Headers actuales:', req.headers);
  
  // Obtener el token válido (con validación automática)
  const token = tokenService.getValidToken();
  console.log('🔑 Token encontrado en localStorage:', token ? 'SÍ' : 'NO');
  
  if (token) {
    console.log('🔑 Token (primeros 20 caracteres):', token.substring(0, 20) + '...');
    
    // Verificar si el token está próximo a expirar
    const timeRemaining = tokenService.getTokenTimeRemaining(token);
    if (timeRemaining < 5) {
      console.log('⚠️ Token expira en menos de 5 minutos');
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
    
    console.log('✅ Headers después de agregar token:', authReq.headers);
    console.log('🔍 ===== FIN AUTH INTERCEPTOR =====');
    return next(authReq);
  }
  
  // Si no hay token válido, continuar sin modificar
  console.log('⚠️ No hay token válido, continuando sin Authorization header');
  console.log('🔍 ===== FIN AUTH INTERCEPTOR =====');
  return next(req);
};
