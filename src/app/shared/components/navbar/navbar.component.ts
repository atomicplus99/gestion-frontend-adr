import { Component } from '@angular/core';
import { SharedNavbarRightComponent } from './components/shared-navbar-right/shared-navbar-right.component';
import { SharedNavbarLeftComponent } from './components/shared-navbar-left/shared-navbar-left.component';


@Component({
  selector: 'shared-navbar',
  imports: [SharedNavbarRightComponent, SharedNavbarLeftComponent],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent {

}
