import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarItem } from '../../interfaces/sideBar-item.interface';
import { SharedIconComponent } from '../../../shared-icon/shared-icon.component';

@Component({
  selector: 'shared-sidebar-item',
  standalone: true,
  imports: [CommonModule, SharedIconComponent],
  templateUrl: './sidebar-item.component.html',
})
export class SidebarItemComponent {
  @Input() item!: SidebarItem;

  showChildren = false;

  toggleChildren() {
    this.showChildren = !this.showChildren;
  }
}
