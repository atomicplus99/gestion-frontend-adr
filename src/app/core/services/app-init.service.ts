import { Injectable } from '@angular/core';
import { AuthService } from '../../auth/services/auth.service';
import { UserStoreService } from '../../auth/store/user.store';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AppInitService {
  constructor(
    private readonly authService: AuthService,
    private readonly userStore: UserStoreService
  ) {}

  async init(): Promise<void> {
    try {
      const user = await firstValueFrom(this.authService.getUserInfo());
      console.log('Usuario recuperado en la inicialización:', user); // Agrega registros
      this.userStore.setUser(user);
    } catch (err) {
      console.error('Error al recuperar usuario:', err); // Agrega registro de errores
      this.userStore.clearUser();
    }
  }
}
