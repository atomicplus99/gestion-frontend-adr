import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { TokenService } from '../services/token.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  // NO interceptar errores de login
  if (req.url.includes('/auth/login')) {
    return next(req);
  }
  
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Solo devolver el error original, sin procesar
      return throwError(() => error);
    })
  );
};
