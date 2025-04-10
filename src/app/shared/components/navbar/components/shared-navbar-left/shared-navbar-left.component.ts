import { Component } from '@angular/core';
import { SharedSidebarToggleComponent } from "./components/shared-sidebar-toggle/shared-sidebar-toggle.component";
import { SharedBrandLogoComponent } from "./components/shared-brand-logo/shared-brand-logo.component";
import { SharedNavbarSearchComponent } from "./components/shared-navbar-search/shared-navbar-search.component";

@Component({
  selector: '[shared-navbar-left]',
  imports: [SharedSidebarToggleComponent, SharedBrandLogoComponent, SharedNavbarSearchComponent],
  templateUrl: './shared-navbar-left.component.html',
})
export class SharedNavbarLeftComponent {

}
