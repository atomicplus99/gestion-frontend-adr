import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterOutlet } from '@angular/router';
import { LoaderService } from './shared/loader/loader.service';
import { filter } from 'rxjs';
import { CommonModule } from '@angular/common';
import { LoaderComponent } from './shared/loader/loader.component';
import { AuthService } from './auth/services/auth.service';
import { UserStoreService } from './auth/store/user.store';
import { TokenService } from './auth/services/token.service';
import { firstValueFrom, catchError, of } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [ HttpClientModule, RouterOutlet, CommonModule, LoaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  
})
export class AppComponent implements OnInit{

  loaderService = inject(LoaderService);
  private router = inject(Router);
  private authService = inject(AuthService);
  private userStore = inject(UserStoreService);
  private tokenService = inject(TokenService);

  ngOnInit() {
    // Restaurar sesión del usuario si hay token válido
    this.restoreUserSession();
    
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

  private async restoreUserSession(): Promise<void> {
    try {
      console.log('🔄 [APP] Iniciando restoreUserSession...');
      console.log('🔄 [APP] Token válido:', this.tokenService.isTokenValid());
      console.log('🔄 [APP] Usuario en store:', this.userStore.isAuthenticated());
      
      // Solo restaurar si hay token válido y NO hay usuario en el store
      if (this.tokenService.isTokenValid() && !this.userStore.isAuthenticated()) {
        console.log('🔄 [APP] Restaurando sesión del usuario...');
        const user = await firstValueFrom(
          this.authService.getUserInfo().pipe(
            catchError((error) => {
              console.error('❌ [APP] Error al restaurar sesión:', error);
              return of(null);
            })
          )
        );
  
        // Verificar que la respuesta sea válida (no un error object)
        if (user && !(user as any).hasOwnProperty('error') && !(user as any).hasOwnProperty('statusCode')) {
          console.log('✅ [APP] Sesión restaurada exitosamente:', user);
          this.userStore.setUser(user);
          console.log('✅ [APP] Usuario establecido en store después de restaurar');
        } else {
          console.warn('⚠️ [APP] Respuesta inválida del backend, no restaurando sesión:', user);
          // Solo limpiar el token si realmente es inválido (error 401)
          if (user && (user as any).statusCode === 401) {
            console.log('🧹 [APP] Token inválido (401), limpiando...');
            this.tokenService.clearToken();
            // NO limpiar el usuario del store, mantener los datos del login anterior
          }
          // NO limpiar el token aquí, solo no restaurar la sesión
          // El usuario del store se mantiene para la navegación
          console.log('ℹ️ [APP] Manteniendo usuario existente en store');
        }
      } else if (this.tokenService.isTokenValid() && this.userStore.isAuthenticated()) {
        console.log('✅ [APP] Usuario ya autenticado en store, no restaurando sesión');
      } else if (!this.tokenService.isTokenValid()) {
        console.log('ℹ️ [APP] No hay token válido');
      } else {
        console.log('ℹ️ [APP] Usuario ya autenticado en store');
      }
      
      console.log('🔄 [APP] Estado final del store:', {
        tokenValido: this.tokenService.isTokenValid(),
        usuarioAutenticado: this.userStore.isAuthenticated(),
        usuarioEnStore: this.userStore.getUserSilently()
      });
    } catch (err) {
      console.error('❌ [APP] Error inesperado al restaurar sesión:', err);
      // Ignorar errores, no hacer nada
    }
  }
}
