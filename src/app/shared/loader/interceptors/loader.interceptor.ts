import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { LoaderService } from '../loader.service';


export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loaderService = inject(LoaderService);
  
  // Verificar si la petición es para ausencias masivas, notificaciones o administración de personal
  const isAusenciasMasivasRequest = req.url.includes('/asistencia/ausencias-masivas/');
  const isNotificacionesRequest = req.url.includes('/notificaciones');
  const isAdministracionPersonalRequest = req.url.includes('/administradores') || 
                                         req.url.includes('/directores') || 
                                         req.url.includes('/auxiliares') || 
                                         req.url.includes('/alumnos') ||
                                         req.url.includes('/usuarios');
  
  // Solo mostrar el loader si NO es una petición de ausencias masivas, notificaciones o administración de personal
  if (!isAusenciasMasivasRequest && !isNotificacionesRequest && !isAdministracionPersonalRequest) {
    loaderService.show();
  }
  
  return next(req).pipe(
    finalize(() => {
      // Solo ocultar el loader si se mostró
      if (!isAusenciasMasivasRequest && !isNotificacionesRequest && !isAdministracionPersonalRequest) {
        loaderService.hide();
      }
    })
  );
};