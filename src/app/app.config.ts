import { ApplicationConfig, APP_INITIALIZER, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideToastr } from 'ngx-toastr';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';

import { AppInitService } from './core/services/app-init.service';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { loadingInterceptor } from './shared/loader/interceptors/loader.interceptor';
import { errorInterceptor } from './auth/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(BrowserAnimationsModule),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([loadingInterceptor, errorInterceptor])
    ),
    
    // Animaciones (versión async recomendada para PrimeNG)
    provideAnimationsAsync(),
    
    // Toastr
    provideToastr({
      positionClass: 'toast-top-right',
      toastClass: 'bg-black text-white p-4 rounded-lg shadow-lg',
      timeOut: 3000,
      closeButton: true,
      progressBar: true,
    }),

    // Inicializador de la app - RESTAURA LA SESIÓN AL RECARGAR
    {
      provide: APP_INITIALIZER,
      useFactory: (appInitService: AppInitService) => {
        return () => appInitService.init().catch(() => {
          // Si falla la inicialización, no bloquear la aplicación
          return Promise.resolve();
        });
      },
      deps: [AppInitService],
      multi: true,
    }
  ]
};


