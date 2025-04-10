import { Component, Input } from '@angular/core';
import { SidebarGroup } from '../../interfaces/sideBar-group.interface';
import { CommonModule } from '@angular/common';
import { SidebarItemComponent } from '../sidebar-item/sidebar-item.component';

@Component({
  selector: 'shared-sidebar-group',
  imports: [CommonModule, SidebarItemComponent],
  templateUrl: './sidebar-group.component.html',
})
export class SidebarGroupComponent {
  @Input() group!: SidebarGroup;
}
