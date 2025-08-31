import { Component, inject, signal, computed, OnInit, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserStoreService } from '../../../auth/store/user.store';
import { UsuarioService } from '../../../gestion-academica-ar/pages/usuarios/services/usuario.service';
import { PhotoService } from '../../services/photo.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'shared-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent implements OnInit, OnDestroy {
  private userStore = inject(UserStoreService);
  private usuarioService = inject(UsuarioService);
  private photoService = inject(PhotoService);
  
  // Signals para UI
  showNotificationsTooltip = false;
  showSettingsTooltip = false;
  showHelpTooltip = false;
  
  // Signals para tiempo
  currentTime = signal<string>('');
  
  // Signal para la URL real de la foto
  realPhotoUrl = signal<string>('');
  
  private timeInterval?: number;
  
  // Usar computed signals del UserStore
  currentUser = this.userStore.user;
  isAuthenticated = this.userStore.isAuthenticated;
  userRole = this.userStore.userRole;
  
  // Computed signals para evitar recálculos
  displayName = computed(() => {
    const user = this.userStore.getUserSilently();
    if (!user) return '';

    if (user.auxiliar) {
      return `${user.auxiliar.nombre} ${user.auxiliar.apellido}`;
    } else if (user.alumno) {
      return `${user.alumno.nombre} ${user.alumno.apellido}`;
    } else if (user.director) {
      return `${user.director.nombres} ${user.director.apellidos}`;
    } else if (user.administrador) {
      return `${user.administrador.nombres} ${user.administrador.apellidos}`;
    }
    
    return user.username || 'Usuario';
  });
  
  roleDisplay = computed(() => {
    const user = this.userStore.getUserSilently();
    if (!user || !user.role) return '';
    
    const roleMap: { [key: string]: string } = {
      'ADMIN': 'Super Administrador',
      'ADMINISTRADOR': 'Administrador',
      'DIRECTOR': 'Director',
      'AUXILIAR': 'Auxiliar',
      'ALUMNO': 'Alumno'
    };
    
    return roleMap[user.role] || user.role;
  });

  constructor() {
    // Efecto para reaccionar a cambios en el userStore
    effect(() => {
      const currentUser = this.currentUser();
      if (currentUser?.idUser) {
        // Recargar foto cuando cambie el usuario
        this.loadUserPhoto();
      }
    });
  }

  ngOnInit() {
    this.updateTime();
    this.timeInterval = window.setInterval(() => {
      this.updateTime();
    }, 1000);
    
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

  ngOnDestroy() {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
    // Limpiar los event listeners
    window.removeEventListener('photoUpdated', this.loadUserPhoto);
    window.removeEventListener('userDataUpdated', this.loadUserPhoto);
  }

  private updateTime() {
    const now = new Date();
    this.currentTime.set(now.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }));
  }

  getUserPhoto(): string {
    const user = this.currentUser();
    
    // Usar la foto del userStore directamente
    if (user?.photo) {
      return user.photo;
    }
    
    // Fallback: usar la URL real obtenida del backend
    const fallbackUrl = this.realPhotoUrl();
    return fallbackUrl || '';
  }

  loadUserPhoto(): void {
    const user = this.userStore.getUserSilently();
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





  getCurrentDate(): string {
    return new Date().toLocaleDateString('es-ES', { 
      day: '2-digit',
      month: 'short'
    });
  }

  getCurrentDateFormatted(): string {
    return new Date().toLocaleDateString('es-ES', { 
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }
}