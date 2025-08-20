import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterOutlet } from '@angular/router';
import { LoaderService } from './shared/loader/loader.service';
import { filter } from 'rxjs';
import { CommonModule } from '@angular/common';
import { LoaderComponent } from './shared/loader/loader.component';


@Component({
  selector: 'app-root',
  imports: [ HttpClientModule, RouterOutlet, CommonModule, LoaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  
})
export class AppComponent implements OnInit{

  loaderService = inject(LoaderService);
  private router = inject(Router);

  ngOnInit() {
    // Ocultar el loader estático de index.html después de cargar la aplicación
    setTimeout(() => {
      const loader = document.getElementById('app-loading');
      if (loader) {
        loader.style.display = 'none';
      }
      this.loaderService.hide();
    }, 500);

    // Configurar loader para navegación entre rutas
    this.router.events
      .pipe(filter(event => 
        event instanceof NavigationStart || 
        event instanceof NavigationEnd || 
        event instanceof NavigationCancel || 
        event instanceof NavigationError
      ))
      .subscribe(event => {
        console.log('🧭 Router Event:', event.constructor.name, event);
        
        if (event instanceof NavigationStart) {
          console.log('🚀 Navegación iniciada hacia:', (event as NavigationStart).url);
          this.loaderService.show();
        } else if (event instanceof NavigationEnd) {
          console.log('✅ Navegación completada hacia:', (event as NavigationEnd).urlAfterRedirects);
          setTimeout(() => this.loaderService.hide(), 500);
        } else if (event instanceof NavigationCancel) {
          console.log('❌ Navegación cancelada:', (event as NavigationCancel).reason);
          setTimeout(() => this.loaderService.hide(), 500);
        } else if (event instanceof NavigationError) {
          console.log('💥 Error de navegación:', (event as NavigationError).error);
          setTimeout(() => this.loaderService.hide(), 500);
        }
      });
  }

}
