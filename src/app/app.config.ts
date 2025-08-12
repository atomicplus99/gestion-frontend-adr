import { ApplicationConfig, APP_INITIALIZER, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideToastr } from 'ngx-toastr';
import { HttpClientModule, provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';

import { AppInitService } from './core/services/app-init.service';

// PrimeNG
import Aura from '@primeng/themes/aura';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { loadingInterceptor } from './shared/loader/interceptors/loader.interceptor';
import { authInterceptor } from './auth/interceptors/auth.interceptor';
import { errorInterceptor } from './auth/interceptors/error.interceptor';

// Log para verificar que se esté importando correctamente
console.log('🔧 App config cargando...');
console.log('🔧 AuthInterceptor importado:', authInterceptor);
console.log('🔧 LoadingInterceptor importado:', loadingInterceptor);
console.log('🔧 ErrorInterceptor importado:', errorInterceptor);

export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(HttpClientModule, BrowserAnimationsModule),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([loadingInterceptor, authInterceptor, errorInterceptor])
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

    // Inicializador de tu app
    {
      provide: APP_INITIALIZER,
      useFactory: (appInitService: AppInitService) => () => appInitService.init(),
      deps: [AppInitService],
      multi: true,
    }
  ]
};

console.log('🔧 App config configurado con interceptors:', appConfig.providers);
