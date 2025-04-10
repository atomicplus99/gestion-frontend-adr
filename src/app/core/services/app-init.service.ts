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
        this.userStore.setUser(user);
      } catch (err) {
        this.userStore.clearUser();
      }
  }
}
