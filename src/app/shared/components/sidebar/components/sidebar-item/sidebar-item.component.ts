import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterLink, RouterLinkActive } from '@angular/router';
import { SidebarItem } from '../../interfaces/sideBar-item.interface';
import { SharedIconComponent } from '../../../shared-icon/shared-icon.component';
import { filter } from 'rxjs';

@Component({
  selector: 'shared-sidebar-item',
  standalone: true,
  imports: [CommonModule, SharedIconComponent, RouterLink, RouterLinkActive],
  templateUrl: './sidebar-item.component.html',
})
export class SidebarItemComponent implements OnInit {
  @Input() item!: SidebarItem;
  showChildren = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(() => {
      this.checkIfAnyChildIsActive();
    });

    this.checkIfAnyChildIsActive();
  }

  toggleChildren(): void {
    this.showChildren = !this.showChildren;
  }

  private checkIfAnyChildIsActive(): void {
    if (!this.item.children) return;

    const currentUrl = this.router.url;
    this.showChildren = this.item.children.some(child => 
      !!child.link && currentUrl.startsWith(child.link)
    );
  }
}
