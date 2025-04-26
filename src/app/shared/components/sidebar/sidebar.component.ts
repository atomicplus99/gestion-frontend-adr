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
          label: 'Registrar',
          link: '#',
          children: [
            { label: 'Registro Manual', link: '/home/registrar/manual' },
            { label: 'Desde Excel', link: '/home/registrar/excel' },
            { label: 'Actualizar Alumno', link: '/home/registrar/actualizar-alumno' },
            { label: 'Lista de Alumnos', link: '/home/registrar/list-alumno'},
            { label: 'Eliminar Alumno', link: '/home/registrar/delete-alumno' }
          ],
        },
        {
          icon: 'kanban',
          label: 'Asistencia',
          badge: 'Pro',
          external: true,
          children: [
            { label: 'Asistencias Alumnos', link: '/home/asistencia/list-asistencia-alumnos' },
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
