import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig).catch((err) => {
  // Manejo de errores durante el bootstrap
  if (err.message && err.message.includes('APP_INITIALIZER')) {
    // Error en el inicializador, continuar con la aplicación
    return;
  }
});
