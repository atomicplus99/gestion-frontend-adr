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
    console.log('🚀 AppInitService: Iniciando inicialización de app');
    try {
      console.log('📞 AppInitService: Llamando a getUserInfo()');
      const user = await firstValueFrom(this.authService.getUserInfo());
      console.log('✅ AppInitService: Usuario obtenido:', user);
      
      this.userStore.setUser(user);
      console.log('✅ AppInitService: Usuario establecido en store');
    } catch (err) {
      console.error('❌ AppInitService: Error al recuperar usuario:', err);
      this.userStore.clearUser();
      console.log('🧹 AppInitService: Store de usuario limpiado');
    }
  }
}
