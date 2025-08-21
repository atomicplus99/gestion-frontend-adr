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
  
  // Usar computed signals del UserStore
  currentUser = this.userStore.user;
  isAuthenticated = this.userStore.isAuthenticated;
  userRole = this.userStore.userRole;

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
    const user = this.userStore.getUserSilently();
    return user?.photo || 'assets/images/default-avatar.png';
  }

  onImageError(event: any): void {
    event.target.src = `${environment.apiUrl}/uploads/profiles/no-image.png`;
  }

  getDisplayName(): string {
    const user = this.userStore.getUserSilently();
    if (!user) return '';

    if (user.auxiliar) {
      return `${user.auxiliar.nombre} ${user.auxiliar.apellido}`;
    } else if (user.alumno) {
      return `${user.alumno.nombre} ${user.alumno.apellido}`;
    }
    
    return user.username || 'Usuario';
  }

  getRoleDisplay(): string {
    const user = this.userStore.getUserSilently();
    if (!user || !user.role) return '';

    const roleMap: { [key: string]: string } = {
      'AUXILIAR': 'Auxiliar',
      'ADMIN': 'Administrador',
      'ALUMNO': 'Alumno',
      'auxiliar': 'Auxiliar',
      'alumno': 'Alumno'
    };
    
    return roleMap[user.role] || user.role;
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