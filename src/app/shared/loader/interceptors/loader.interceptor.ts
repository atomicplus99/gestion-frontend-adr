import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { LoaderService } from '../loader.service';


export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loaderService = inject(LoaderService);
  
  // Verificar si la petición es para ausencias masivas o notificaciones
  const isAusenciasMasivasRequest = req.url.includes('/asistencia/ausencias-masivas/');
  const isNotificacionesRequest = req.url.includes('/notificaciones');
  
  // Solo mostrar el loader si NO es una petición de ausencias masivas o notificaciones
  if (!isAusenciasMasivasRequest && !isNotificacionesRequest) {
    loaderService.show();
  }
  
  return next(req).pipe(
    finalize(() => {
      // Solo ocultar el loader si se mostró
      if (!isAusenciasMasivasRequest && !isNotificacionesRequest) {
        loaderService.hide();
      }
    })
  );
};