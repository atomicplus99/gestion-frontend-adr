import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserStoreService } from '../../../auth/store/user.store';
import { environment } from '../../../../environments/environment';


@Component({
  selector: 'shared-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent implements OnInit, OnDestroy {
  private userStore = inject(UserStoreService);
  
  // Signals para UI
  showNotificationsTooltip = false;
  showSettingsTooltip = false;
  showHelpTooltip = false;
  
  // Signals para tiempo
  currentTime = signal<string>('');
  
  private timeInterval?: number;
  
  // Usuario actual
  currentUser = this.userStore.user;

  ngOnInit() {
    this.updateTime();
    this.timeInterval = window.setInterval(() => {
      this.updateTime();
    }, 1000);
  }

  ngOnDestroy() {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
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
    if (user?.photo && user.photo.trim() !== '') {
      return user.photo;
    }
    return `${environment.apiUrl}/uploads/profiles/no-image.png`;
  }

  onImageError(event: any): void {
    event.target.src = `${environment.apiUrl}/uploads/profiles/no-image.png`;
  }

  getDisplayName(): string {
    const user = this.currentUser();
    if (!user) return '';
    
    const fullName = user.nombreCompleto || user.username;
    // Mostrar solo el primer nombre si es muy largo
    if (fullName && fullName.length > 15) {
      return fullName.split(' ')[0];
    }
    return fullName;
  }

  getRoleDisplay(): string {
    const user = this.currentUser();
    if (!user) return '';
    
    const roleMap: { [key: string]: string } = {
      'admin': 'Administrador',
      'user': 'Usuario',
      'student': 'Estudiante',
      'teacher': 'Profesor',
      'auxiliary': 'Auxiliar',
      'moderator': 'Moderador',
      'editor': 'Editor'
    };
    
    return roleMap[user.role.toLowerCase()] || user.role;
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

  getTemperature(): string {
    // Puedes conectar esto con tu servicio del clima o usar un valor por defecto
    return '22°C';
  }
}