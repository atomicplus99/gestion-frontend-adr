import { Component } from '@angular/core';
import { SharedNavbarSearchToggleComponent } from "./components/shared-navbar-search-toggle/shared-navbar-search-toggle.component";
import { SharedNavbarGithubStarsComponent } from "./components/shared-navbar-github-stars/shared-navbar-github-stars.component";
import { SharedNavbarUpgradeButtonComponent } from "./components/shared-navbar-upgrade-button/shared-navbar-upgrade-button.component";

@Component({
  selector: '[shared-navbar-right]',
  imports: [SharedNavbarSearchToggleComponent,
            SharedNavbarGithubStarsComponent,
            SharedNavbarUpgradeButtonComponent],
  templateUrl: './shared-navbar-right.component.html',

})
export class SharedNavbarRightComponent {

}
