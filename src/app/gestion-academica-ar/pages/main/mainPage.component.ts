import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { IconCheckComponent } from "../../../shared/components/icon-check/icon-check.component";
import { SidebarComponent } from "../../../shared/components/sidebar/sidebar.component";
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-main-page',
  imports: [
    CommonModule,
    NavbarComponent,
    SidebarComponent,
    RouterOutlet
],
            
  templateUrl: './mainPage.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainPageComponent {



 }
