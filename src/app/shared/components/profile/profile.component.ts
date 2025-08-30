import { Component, computed, inject, OnInit, signal } from '@angular/core';
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
export class ProfileComponent implements OnInit {
  private readonly userStore = inject(UserStoreService);
  private readonly authService = inject(AuthService);
  private readonly tokenService = inject(TokenService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly photoService = inject(PhotoService);

  readonly user = computed(() => this.userStore.user());
  
  // Signal para la URL real de la foto
  realPhotoUrl = signal<string>('');

  readonly photoUrl = computed(() => {
    const user = this.user();
    
    // Usar la URL real obtenida del backend
    if (user?.idUser) {
      return this.realPhotoUrl() || '';
    }
    
    return '';
  });
  
  readonly username = computed(() => {
    const user = this.user();
    if (!user) return 'Sin nombre';
    
    if (user.auxiliar) {
      return `${user.auxiliar.nombre} ${user.auxiliar.apellido}`;
    } else if (user.alumno) {
      return `${user.alumno.nombre} ${user.alumno.apellido}`;
    } else if (user.director) {
      return `${user.director.nombres} ${user.director.apellidos}`;
    } else if (user.administrador) {
      return `${user.administrador.nombres} ${user.administrador.apellidos}`;
    }
    return user.username;
  });
  
  readonly role = computed(() =>
    this.user()?.role ?? 'Desconocido'
  );

  ngOnInit() {
    // Cargar la foto del usuario al inicializar
    this.loadUserPhoto();
  }
  
  loadUserPhoto(): void {
    const user = this.user();
    if (user?.idUser) {
      this.photoService.getUserPhoto(user.idUser).subscribe({
        next: (photoUrl) => {
          this.realPhotoUrl.set(photoUrl);
        },
        error: (error) => {
          this.realPhotoUrl.set('');
        }
      });
    }
  }

  onImageError(event: any): void {
    event.target.style.display = 'none';
  }

  // private async restoreUserSession(): Promise<void> {
  //   // Método deshabilitado - app.component.ts se encarga de restaurar sesión
  // }
}
