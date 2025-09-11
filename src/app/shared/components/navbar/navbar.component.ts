import { Component, inject, signal, computed, OnInit, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { UserStoreService } from '../../../auth/store/user.store';
import { UsuarioService } from '../../../gestion-academica-ar/pages/usuarios/services/usuario.service';
import { PhotoService } from '../../services/photo.service';
import { environment } from '../../../../environments/environment';
import { NotificationsBellComponent } from '../notifications-bell/notifications-bell.component';

@Component({
  selector: 'shared-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, NotificationsBellComponent],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent implements OnInit, OnDestroy {
  private userStore = inject(UserStoreService);
  private usuarioService = inject(UsuarioService);
  private photoService = inject(PhotoService);
  private router = inject(Router);
  
  // Signals para UI
  showSettingsTooltip = false;
  showHelpTooltip = false;
  showSearchResults = false;
  showUserDropdown = false;
  
  // Signals para tiempo
  currentTime = signal<string>('');
  
  // Signal para la URL real de la foto
  realPhotoUrl = signal<string>('');
  
  // Signal para búsqueda
  searchQuery = signal<string>('');
  searchResults = signal<any[]>([]);
  
  private timeInterval?: number;
  
  // Opciones del sidebar para búsqueda
  private sidebarOptions = [
    { label: 'Inicio', link: '/home/welcome', category: 'Principal' },
    { label: 'Registro Manual', link: '/home/registrar/manual', category: 'Alumnos' },
    { label: 'Desde Excel', link: '/home/registrar/excel', category: 'Alumnos' },
    { label: 'Actualizar Alumno', link: '/home/registrar/actualizar-alumno', category: 'Alumnos' },
    { label: 'Lista de Alumnos', link: '/home/registrar/list-alumno', category: 'Alumnos' },
    { label: 'Imprimir QR', link: '/home/registrar/imprimir-qr-alumnos', category: 'Alumnos' },
    { label: 'Estado de Alumno', link: '/home/registrar/delete-alumno', category: 'Alumnos' },
    { label: 'Registro Apoderado', link: '/home/apoderado/register-apoderado', category: 'Apoderados' },
    { label: 'Editar Apoderado', link: '/home/apoderado/edit-apoderado', category: 'Apoderados' },
    { label: 'Asignar Apoderado', link: '/home/apoderado/asign-apoderado', category: 'Apoderados' },
    { label: 'Eliminar Apoderado', link: '/home/apoderado/delete-apoderado', category: 'Apoderados' },
    { label: 'Lista de Apoderados', link: '/home/apoderado/list-apoderados', category: 'Apoderados' },
    { label: 'Asistencia Manual', link: '/home/asistencia/register-manual-alumnos', category: 'Asistencia' },
    { label: 'Registrar Ausencia', link: '/home/asistencia/create-ausencia-alumnos', category: 'Asistencia' },
    { label: 'Lista de Asistencia', link: '/home/asistencia/list-asistencia-alumnos', category: 'Asistencia' },
    { label: 'Actualizar Asistencia', link: '/home/asistencia/update-asistencia-alumnos', category: 'Asistencia' },
    { label: 'Anular Asistencia', link: '/home/asistencia/delete-asistencia-alumnos', category: 'Asistencia' },
    { label: 'Programa de Ausencias', link: '/home/ausencias-masivas/programa', category: 'Ausencias Masivas' },
    { label: 'Registrar Solicitud', link: '/home/justificaciones/create-solicitud-justificacion', category: 'Justificaciones' },
    { label: 'Ver Solicitudes', link: '/home/justificaciones/list-solicitudes-justificaciones-alumnos', category: 'Justificaciones' },
    { label: 'Marcar Justificaciones', link: '/home/justificaciones/actualizar-estado-justificaciones', category: 'Justificaciones' },
    { label: 'Lista Usuarios', link: '/home/usuarios/lista-usuarios', category: 'Usuarios' },
    { label: 'Crear Usuario', link: '/home/usuarios/create-usuario', category: 'Usuarios' },
    { label: 'Staff', link: '/home/usuarios/administracion-personal', category: 'Administración de Personal' },
    { label: 'Cerrar Sesión', link: '/login', category: 'Sistema' }
  ];
  
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

    // Escuchar clicks fuera del componente para cerrar dropdowns
    document.addEventListener('click', this.onDocumentClick.bind(this));
  }

  ngOnDestroy() {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
    // Limpiar los event listeners
    window.removeEventListener('photoUpdated', this.loadUserPhoto);
    window.removeEventListener('userDataUpdated', this.loadUserPhoto);
    document.removeEventListener('click', this.onDocumentClick.bind(this));
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

  // Métodos para búsqueda
  onSearchInput(event: any): void {
    const query = event.target.value.toLowerCase().trim();
    this.searchQuery.set(query);
    
    if (query.length > 0) {
      this.performSearch(query);
      this.showSearchResults = true;
    } else {
      this.searchResults.set([]);
      this.showSearchResults = false;
    }
  }

  private performSearch(query: string): void {
    const results = this.sidebarOptions.filter(option => 
      option.label.toLowerCase().includes(query) ||
      option.category.toLowerCase().includes(query)
    );
    
    this.searchResults.set(results.slice(0, 8)); // Limitar a 8 resultados
  }

  onSearchResultClick(result: any): void {
    this.router.navigate([result.link]);
    this.searchQuery.set('');
    this.searchResults.set([]);
    this.showSearchResults = false;
    
    // Limpiar el input
    const searchInput = document.querySelector('input[placeholder="Buscar en el sistema..."]') as HTMLInputElement;
    if (searchInput) {
      searchInput.value = '';
    }
  }

  onSearchKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.showSearchResults = false;
      this.searchQuery.set('');
      this.searchResults.set([]);
      
      // Limpiar el input
      const searchInput = event.target as HTMLInputElement;
      searchInput.value = '';
    }
  }

  onSearchFocus(): void {
    if (this.searchQuery().length > 0) {
      this.showSearchResults = true;
    }
  }

  onSearchBlur(): void {
    // Delay para permitir clicks en los resultados
    setTimeout(() => {
      this.showSearchResults = false;
    }, 200);
  }

  // Métodos para el dropdown del usuario
  toggleUserDropdown(): void {
    this.showUserDropdown = !this.showUserDropdown;
    // Cerrar otros dropdowns
    this.showSettingsTooltip = false;
    this.showHelpTooltip = false;
  }

  logout(): void {
    // Cerrar el dropdown
    this.showUserDropdown = false;
    
    // Limpiar el userStore
    this.userStore.clearUser();
    
    // Navegar al login
    this.router.navigate(['/login']);
  }

  // Cerrar dropdowns al hacer click fuera
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.relative')) {
      this.showUserDropdown = false;
      this.showSettingsTooltip = false;
      this.showHelpTooltip = false;
      this.showSearchResults = false;
    }
  }
}