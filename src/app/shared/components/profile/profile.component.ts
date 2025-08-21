import { Component, computed, inject, OnInit } from '@angular/core';
import { UserStoreService } from '../../../auth/store/user.store';
import { AuthService } from '../../../auth/services/auth.service';
import { TokenService } from '../../../auth/services/token.service';
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

  readonly user = computed(() => this.userStore.user());

  readonly photoUrl = computed(() => {
    const user = this.user();
    return user ? `${environment.apiUrl}/${user.photo}` : `${environment.apiUrl}/uploads/profiles/no-image.png`;
  });
  
  readonly username = computed(() => {
    const user = this.user();
    if (!user) return 'Sin nombre';
    
    if (user.auxiliar) {
      return `${user.auxiliar.nombre} ${user.auxiliar.apellido}`;
    } else if (user.alumno) {
      return `${user.alumno.nombre} ${user.alumno.apellido}`;
    }
    
    return user.username;
  });
  
  readonly role = computed(() =>
    this.user()?.role ?? 'Desconocido'
  );

  ngOnInit() {
    // NO restaurar sesión aquí, app.component.ts ya se encarga de eso
    // Solo usar el usuario del store
    console.log('👤 [PROFILE] Componente inicializado, usando usuario del store');
  }

  // private async restoreUserSession(): Promise<void> {
  //   // Método deshabilitado - app.component.ts se encarga de restaurar sesión
  // }
}
