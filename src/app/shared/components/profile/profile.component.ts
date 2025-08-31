import { Component, computed, inject, OnInit, OnDestroy, signal, effect, runInInjectionContext } from '@angular/core';
import { Router } from '@angular/router';
import { UserStoreService } from '../../../auth/store/user.store';
import { AuthService } from '../../../auth/services/auth.service';
import { TokenService } from '../../../auth/services/token.service';
import { UsuarioService } from '../../../gestion-academica-ar/pages/usuarios/services/usuario.service';
import { PhotoService } from '../../services/photo.service';
import { firstValueFrom, catchError, of } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'shared-profile',
  templateUrl: './profile.component.html',
  standalone: true
})
export class ProfileComponent implements OnInit, OnDestroy {
  private readonly userStore = inject(UserStoreService);
  private readonly authService = inject(AuthService);
  private readonly tokenService = inject(TokenService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly photoService = inject(PhotoService);
  private readonly router = inject(Router);

  readonly user = computed(() => this.userStore.user());
  
  // Signal para la URL real de la foto
  realPhotoUrl = signal<string>('');
  
  // Signal para la foto con cache busting
  photoWithCacheBust = signal<string>('');

  readonly photoUrl = computed(() => {
    const user = this.user();
    
    // Usar la foto con cache busting del userStore
    if (user?.photo) {
      const cacheBustedPhoto = this.photoWithCacheBust();
      return cacheBustedPhoto || user.photo;
    }
    
    // Fallback: usar la URL real obtenida del backend
    if (user?.idUser) {
      const fallbackUrl = this.realPhotoUrl();
      return fallbackUrl || '';
    }
    
    return '';
  });
  
  readonly username = computed(() => {
    const user = this.user();
    if (!user) return 'Sin nombre';
    
    if (user.auxiliar) {
      const name = `${user.auxiliar.nombre} ${user.auxiliar.apellido}`;
      return name;
    } else if (user.alumno) {
      const name = `${user.alumno.nombre} ${user.alumno.apellido}`;
      return name;
    } else if (user.director) {
      const name = `${user.director.nombres} ${user.director.apellidos}`;
      return name;
    } else if (user.administrador) {
      const name = `${user.administrador.nombres} ${user.administrador.apellidos}`;
      return name;
    }
    return user.username;
  });
  
  readonly role = computed(() =>
    this.user()?.role ?? 'Desconocido'
  );

  constructor() {
    // Efecto para reaccionar a cambios en el userStore
    effect(() => {
      const currentUser = this.user();
      
      // Actualizar foto con cache busting cuando cambie
      if (currentUser?.photo) {
        const timestamp = Date.now();
        const photoWithCacheBust = `${currentUser.photo}?t=${timestamp}`;
        this.photoWithCacheBust.set(photoWithCacheBust);
      }
      
      if (currentUser?.idUser) {
        // Recargar foto cuando cambie el usuario
        this.loadUserPhoto();
      }
    });
  }

  ngOnInit() {
    // Cargar la foto del usuario al inicializar
    this.loadUserPhoto();
    
    // Escuchar eventos de actualización de foto
    window.addEventListener('photoUpdated', (event: any) => {
      this.loadUserPhoto();
    });

    // Escuchar eventos de actualización de datos del usuario
    window.addEventListener('userDataUpdated', (event: any) => {
      this.loadUserPhoto();
    });
  }
  
  loadUserPhoto(): void {
    const user = this.user();
    if (user?.idUser && !user.photo) {
      this.usuarioService.obtenerUrlFotoPerfil(user.idUser).subscribe({
        next: (response) => {
          if (response.success && response.data?.foto_url) {
            this.realPhotoUrl.set(response.data.foto_url);
          } else {
            this.realPhotoUrl.set('assets/default-avatar.png');
          }
        },
        error: (error) => {
          console.error('Error al cargar foto:', error);
          this.realPhotoUrl.set('assets/default-avatar.png');
        }
      });
    }
  }

  onImageError(event: any): void {
    event.target.style.display = 'none';
  }

  irAPerfil(): void {
    this.router.navigate(['/home/perfil']);
  }

  ngOnDestroy(): void {
    // Limpiar los event listeners
    window.removeEventListener('photoUpdated', this.loadUserPhoto);
    window.removeEventListener('userDataUpdated', this.loadUserPhoto);
  }

  // private async restoreUserSession(): Promise<void> {
  //   // Método deshabilitado - app.component.ts se encarga de restaurar sesión
  // }
}
