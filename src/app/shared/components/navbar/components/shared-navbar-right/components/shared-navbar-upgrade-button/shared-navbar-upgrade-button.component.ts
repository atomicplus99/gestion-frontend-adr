import { Component } from '@angular/core';
import { LogoutService } from '../../../../../../../auth/services/logout.service';
import { Router } from '@angular/router';
import { AlertsService } from '../../../../../../alerts.service';
import { UserStoreService } from '../../../../../../../auth/store/user.store';

@Component({
  selector: 'shared-navbar-upgrade-button',
  imports: [],
  templateUrl: './shared-navbar-upgrade-button.component.html',
})
export class SharedNavbarUpgradeButtonComponent {

  constructor(
    private alertsService: AlertsService,
    private logoutService: LogoutService,
    private userStore: UserStoreService,
    private router: Router
  ) {}

  logout() {
    this.alertsService.confirm('¿Deseas cerrar sesión?').then(confirm => {
      if (confirm) {
        this.logoutService.logout().subscribe(() => {
          this.userStore.clearUser();
          this.router.navigate(['/login']);
        });
      }
    });
  }

}
