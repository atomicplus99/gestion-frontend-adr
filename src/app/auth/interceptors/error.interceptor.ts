import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { TokenService } from '../services/token.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const tokenService = inject(TokenService);
  
  // Solo procesar errores de APIs internas
  const isInternalAPI = req.url.includes('localhost') || req.url.includes('192.168.1.108');
  
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.log('💥 ErrorInterceptor: Error detectado');
      console.log('📍 URL que falló:', req.url);
      console.log('🏠 Es API interna:', isInternalAPI);
      console.log('📄 Status:', error.status);
      console.log('💬 Error:', error.message);
      
      // Solo manejar errores de autenticación para APIs internas
      if (error.status === 401 && isInternalAPI) {
        console.log('🚨 ErrorInterceptor: Error 401 en API interna, redirigiendo al login');
        console.log('🔗 URL que causó el 401:', req.url);
        
        tokenService.clearToken();
        router.navigate(['/login']);
        
        return throwError(() => new Error('Sesión expirada. Por favor, inicia sesión nuevamente.'));
      }
      
      // Para APIs externas con error 401, solo logear pero no redirigir
      if (error.status === 401 && !isInternalAPI) {
        console.log('🌐 ErrorInterceptor: Error 401 en API externa (ignorado)');
        return throwError(() => error);
      }
      
      // Manejar errores de permisos
      if (error.status === 403) {
        
        return throwError(() => new Error('No tienes permisos para acceder a este recurso.'));
      }
      
      // Manejar errores de servidor
      if (error.status >= 500) {
        
        return throwError(() => new Error('Error del servidor. Inténtalo más tarde.'));
      }
      
      // Manejar errores de red
      if (error.status === 0) {
        
        return throwError(() => new Error('No se puede conectar al servidor. Verifica tu conexión.'));
      }
      
      // Para otros errores, devolver el error original
      return throwError(() => error);
    })
  );
};
