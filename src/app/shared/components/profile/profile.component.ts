import { Component, computed, inject } from '@angular/core';
import { UserStoreService } from '../../../auth/store/user.store';
import { environment } from '../../../../environments/environment';


@Component({
  selector: 'shared-profile',
  templateUrl: './profile.component.html',
  standalone: true
})
export class ProfileComponent {
  private readonly userStore = inject(UserStoreService);

  readonly user = computed(() => this.userStore.user());

  readonly photoUrl = computed(() => {
    const user = this.user();
    return user ? `${environment.apiUrl}/${user.photo}` : `${environment.apiUrl}/uploads/profiles/no-image.png`;
  });
  
  
  
  readonly username = computed(() =>
    this.user()?.nombreCompleto ?? 'Sin nombre'
  );
  
  readonly role = computed(() =>
    this.user()?.role ?? 'Desconocido'
  );
}
