import { ApplicationConfig, APP_INITIALIZER, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';
import { HttpClientModule } from '@angular/common/http';
import { routes } from './app.routes';

import { AppInitService } from './core/services/app-init.service';

export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(HttpClientModule),
    provideRouter(routes),
    provideAnimations(),
    provideToastr({
      positionClass: 'toast-top-right',
      toastClass: 'bg-black text-white p-4 rounded-lg shadow-lg',
      timeOut: 3000,
      closeButton: true,
      progressBar: true,
    }),
    {
      provide: APP_INITIALIZER,
      useFactory: (appInitService: AppInitService) => () => appInitService.init(),
      deps: [AppInitService],
      multi: true,
    }
  ]
};
