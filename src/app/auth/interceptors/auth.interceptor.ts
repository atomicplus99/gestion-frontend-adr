import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  console.log('🔍 ===== AUTH INTERCEPTOR EJECUTÁNDOSE =====');
  console.log('🔍 URL de la petición:', req.url);
  console.log('🔍 Método HTTP:', req.method);
  console.log('🔍 Headers actuales:', req.headers);
  
  // Obtener el token del localStorage
  const token = localStorage.getItem('access_token');
  console.log('🔑 Token encontrado en localStorage:', token ? 'SÍ' : 'NO');
  if (token) {
    console.log('🔑 Token (primeros 20 caracteres):', token.substring(0, 20) + '...');
  }
  
  // Si hay token, agregarlo al header Authorization
  if (token) {
    console.log('✅ Agregando token al header Authorization');
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('✅ Headers después de agregar token:', authReq.headers);
    return next(authReq);
  }
  
  // Si no hay token, continuar sin modificar
  console.log('⚠️ No hay token, continuando sin Authorization header');
  console.log('🔍 ===== FIN AUTH INTERCEPTOR =====');
  return next(req);
};
