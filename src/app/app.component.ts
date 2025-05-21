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
        if (event instanceof NavigationStart) {
          this.loaderService.show();
        } else {
          // NavigationEnd, NavigationCancel, NavigationError
          setTimeout(() => this.loaderService.hide(), 500);
        }
      });
  }

}
