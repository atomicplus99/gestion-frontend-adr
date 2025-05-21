import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarGroup } from './interfaces/sideBar-group.interface';
import { SidebarGroupComponent } from './components/sidebar-group/sidebar-group.component';
import { SidebarSearchComponent } from './components/sidebar-search/sidebar-search.component';
import { ProfileComponent } from '../profile/profile.component';
import { UserStoreService } from '../../../auth/store/user.store';


@Component({
  selector: 'shared-sidebar',
  standalone: true,
  imports: [CommonModule, SidebarGroupComponent, SidebarSearchComponent, ProfileComponent],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {


  userRole = computed(() => this.userStore.user()?.role); 
  

  constructor(private userStore: UserStoreService) {

  }

  sidebarGroups: SidebarGroup[] = [
    {
      items: [
        {
          icon: 'kanban',
          label: 'Inicio',
          link: 'welcome'
          
        },
        {
          icon: 'layout-dashboard',
          label: 'Registrar',
          link: '#',
          allowedRoles: ['ALUMNO','AUXILIAR'], // 🎯 Roles permitidos
          children: [
            { label: 'Registro Manual', link: '/home/registrar/manual' },
            { label: 'Desde Excel', link: '/home/registrar/excel' },
            { label: 'Actualizar Alumno', link: '/home/registrar/actualizar-alumno' },
            { label: 'Lista de Alumnos', link: '/home/registrar/list-alumno' },
            { label: 'Eliminar Alumno', link: '/home/registrar/delete-alumno' }
          ],
        },
        {
          icon: 'kanban',
          label: 'Asistencia',
          badge: 'Pro',
          external: true,
          allowedRoles: ['ALUMNO','AUXILIAR'],
          children: [
            { label: 'Asistencia Manual', link: '/home/asistencia/register-manual-alumnos' },
            { label: 'Lista de Asistencia', link: '/home/asistencia/list-asistencia-alumnos' },
            { label: 'Actualizar Asistencia', link: '/home/asistencia/update-asistencia-alumnos' },
            { label: 'Anular Asistencia', link: '/home/asistencia/delete-asistencia-alumnos' },
          ],
        },
        { isSeparator: true },
        {
          icon: 'users',
          label: 'Usuarios',
          link: '#',
          allowedRoles: ['ALUMNO','AUXILIAR'],
          children: [
            { label: 'Lista de usuarios', link: '#' },
            { label: 'Roles y permisos', link: '#' },
          ]
        },
        {
          icon: 'log-in',
          label: 'Sign In',
          link: '/login',
          allowedRoles: ['ADMIN', 'AUXILIAR', 'ALUMNO'], // abierto a varios roles
        },
      ]
    }
  ];

  /**
   * 🎯 Función para saber si el item puede ser mostrado según el rol del usuario
   */
  canActivate(item: any): boolean {
    if (!item.allowedRoles) return true; // Si no define allowedRoles, todos pueden verlo
    const role = this.userRole();
    return role ? item.allowedRoles.includes(role) : false;
  }
}
