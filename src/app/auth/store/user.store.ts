// services/user-store.service.ts - Actualizado para la nueva API
import { Injectable, signal, computed } from '@angular/core';
import { UserInfo } from '../interfaces/user-info.interface';

@Injectable({
  providedIn: 'root'
})
export class UserStoreService {
  private readonly STORAGE_KEY = 'currentUser';
  
  // Signal privado para el usuario
  private readonly _user = signal<UserInfo | null>(null);
  
  // Signal público de solo lectura
  readonly user = this._user.asReadonly();
  
  // Computed para verificar autenticación
  readonly isAuthenticated = computed(() => this._user() !== null);
  
  // Computed para el rol del usuario
  readonly userRole = computed(() => this._user()?.role || null);
  
  // Computed para verificar si es auxiliar
  readonly isAuxiliar = computed(() => this.userRole() === 'AUXILIAR');
  
  // Computed para verificar si es director
  readonly isDirector = computed(() => this.userRole() === 'DIRECTOR');
  
  // Computed para verificar si es administrador
  readonly isAdministrador = computed(() => this.userRole() === 'ADMINISTRADOR');
  
  // Computed para verificar si es admin
  readonly isAdmin = computed(() => this.userRole() === 'ADMIN');
  
  // Computed para verificar si es alumno
  readonly isAlumno = computed(() => this.userRole() === 'ALUMNO');
  
  // Computed para obtener ID del auxiliar
  readonly idAuxiliar = computed(() => this._user()?.auxiliar?.id_auxiliar || null);
  
  // Computed para obtener ID del director
  readonly idDirector = computed(() => this._user()?.director?.id_director || null);
  
  // Computed para obtener ID del administrador
  readonly idAdministrador = computed(() => this._user()?.administrador?.id_administrador || null);
  
  // Computed para verificar si puede registrar asistencia
  readonly canRegisterAttendance = computed(() => {
    const role = this.userRole();
    return role === 'AUXILIAR' || role === 'ADMIN' || role === 'ADMINISTRADOR' || role === 'DIRECTOR';
  });
  
  // Computed para verificar si puede gestionar usuarios
  readonly canManageUsers = computed(() => {
    const role = this.userRole();
    return role === 'ADMIN' || role === 'ADMINISTRADOR' || role === 'DIRECTOR';
  });
  
  // Computed para verificar si puede acceder a reportes
  readonly canAccessReports = computed(() => {
    const role = this.userRole();
    return role === 'ADMIN' || role === 'ADMINISTRADOR' || role === 'DIRECTOR' || role === 'AUXILIAR';
  });

  constructor() {
    this.initializeStore();
  }

  private initializeStore(): void {
    try {
      const storedUser = localStorage.getItem(this.STORAGE_KEY);
      if (storedUser) {
        const user = JSON.parse(storedUser);
        this._user.set(user);
        console.log('🧠 [USER STORE] Payload recuperado de localStorage:', user);
      }
    } catch (error) {
      console.error('Error al recuperar usuario del localStorage:', error);
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  private storeUser(user: UserInfo | null): void {
    try {
      if (user) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(this.STORAGE_KEY);
      }
    } catch (error) {
      console.error('Error al guardar usuario en localStorage:', error);
    }
  }

  setUser(user: UserInfo): void {
    console.log('🧠 [USER STORE] Payload recibido en setUser:', user);
    this._user.set(user);
    this.storeUser(user);
  }

  clearUser(): void {
    this._user.set(null);
    this.storeUser(null);
  }

  // Método para obtener usuario sin logs (para uso interno)
  getUserSilently(): UserInfo | null {
    return this._user();
  }
}