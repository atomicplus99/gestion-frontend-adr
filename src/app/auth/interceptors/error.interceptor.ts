import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { TokenService } from '../services/token.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const tokenService = inject(TokenService);
  
  console.log('🚨 ErrorInterceptor ejecutándose para:', req.url);
  
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.log('🚨 Error capturado:', error.status, error.message);
      
      // Manejar errores de autenticación
      if (error.status === 401) {
        console.log('🚨 Error 401 - No autorizado, limpiando token...');
        tokenService.clearToken();
        router.navigate(['/login']);
        
        return throwError(() => new Error('Sesión expirada. Por favor, inicia sesión nuevamente.'));
      }
      
      // Manejar errores de permisos
      if (error.status === 403) {
        console.log('🚨 Error 403 - Acceso denegado');
        return throwError(() => new Error('No tienes permisos para acceder a este recurso.'));
      }
      
      // Manejar errores de servidor
      if (error.status >= 500) {
        console.log('🚨 Error del servidor:', error.status);
        return throwError(() => new Error('Error del servidor. Inténtalo más tarde.'));
      }
      
      // Manejar errores de red
      if (error.status === 0) {
        console.log('🚨 Error de red - No se puede conectar al servidor');
        return throwError(() => new Error('No se puede conectar al servidor. Verifica tu conexión.'));
      }
      
      // Para otros errores, devolver el error original
      return throwError(() => error);
    })
  );
};
