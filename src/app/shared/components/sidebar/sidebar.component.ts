import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarGroup } from './interfaces/sideBar-group.interface';
import { SidebarGroupComponent } from './components/sidebar-group/sidebar-group.component';
import { SidebarSearchComponent } from './components/sidebar-search/sidebar-search.component';
import { ProfileComponent } from "../profile/profile.component";

@Component({
  selector: 'shared-sidebar',
  imports: [CommonModule, SidebarGroupComponent, SidebarSearchComponent, ProfileComponent],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {

  sidebarGroups: SidebarGroup[] = [
    {
      items: [
        {
          icon: 'layout-dashboard',
          label: 'Mi Perfil',
          link: '#',
          children: [
            { label: 'Datos personales', link: '#' },
            { label: 'Cambiar contraseña', link: '#' },
          ],
        },
        {
          icon: 'kanban',
          label: 'Kanban',
          badge: 'Pro',
          external: true,
          children: [
            { label: 'Mis tableros', link: '#' },
            { label: 'Nuevos proyectos', link: '#' },
          ],
        },
        { isSeparator: true },
        {
          icon: 'users',
          label: 'Usuarios',
          link: '#',
          children: [
            { label: 'Lista de usuarios', link: '#' },
            { label: 'Roles y permisos', link: '#' },
          ]
        },
        {
          icon: 'log-in',
          label: 'Sign In',
          link: '/login'
        },
      ]
    }
  ];
}
