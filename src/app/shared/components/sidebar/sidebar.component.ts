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
          label: 'Alumnos',
          link: '#',
          allowedRoles: ['AUXILIAR', 'DIRECTOR', 'ADMINISTRADOR', 'ADMIN'], // 🎯 Roles permitidos
          children: [
            { label: 'Registro Manual', link: '/home/registrar/manual' },
            { label: 'Desde Excel', link: '/home/registrar/excel' },
            { label: 'Actualizar Alumno', link: '/home/registrar/actualizar-alumno' },
            { label: 'Lista de Alumnos', link: '/home/registrar/list-alumno' },
            { label: 'Imprimir QR', link: '/home/registrar/imprimir-qr-alumnos' },
            { label: 'Estado de Alumno', link: '/home/registrar/delete-alumno' }
          ],
        },
        {
          icon: 'layout-dashboard',
          label: 'Apoderados',
          link: '#',
          allowedRoles: ['AUXILIAR', 'DIRECTOR', 'ADMINISTRADOR', 'ADMIN'], // 🎯 Roles permitidos
          children: [
            { label: 'Registro Apoderado', link: '/home/apoderado/register-apoderado' },
            { label: 'Editar Apoderado', link: '/home/apoderado/edit-apoderado' },
            { label: 'Asignar Apoderado', link: '/home/apoderado/asign-apoderado' },
            { label: 'Eliminar Apoderado', link: '/home/apoderado/delete-apoderado' },
            { label: 'Lista de Apoderados', link: '/home/apoderado/list-apoderados' },
          ],
        },
        {
          icon: 'kanban',
          label: 'Asistencia',
          badge: 'Pro',
          external: true,
          allowedRoles: ['AUXILIAR', 'DIRECTOR', 'ADMINISTRADOR', 'ADMIN'],
          children: [
            { label: 'Asistencia Manual', link: '/home/asistencia/register-manual-alumnos' },
            { label: 'Registrar Ausencia', link: '/home/asistencia/create-ausencia-alumnos' },
            { label: 'Lista de Asistencia', link: '/home/asistencia/list-asistencia-alumnos' },
            { label: 'Actualizar Asistencia', link: '/home/asistencia/update-asistencia-alumnos' },
            { label: 'Anular Asistencia', link: '/home/asistencia/delete-asistencia-alumnos' },
          ],
        },
        {
          icon: 'kanban',
          label: 'Ausencias Masivas',
          badge: 'Pro',
          external: true,
          allowedRoles: ['AUXILIAR', 'DIRECTOR', 'ADMINISTRADOR', 'ADMIN'],
          children: [
            { label: 'Programa de Ausencias', link: '/home/ausencias-masivas/programa' },
          ],
        },
        {
          icon: 'kanban',
          label: 'Justificaciones',
          badge: 'Pro',
          external: true,
          allowedRoles: ['AUXILIAR', 'DIRECTOR', 'ADMINISTRADOR', 'ADMIN'],
          children: [
            { label: 'Registrar Solicitud', link: '/home/justificaciones/create-solicitud-justificacion' },
            { label: 'Ver Solicitudes', link: '/home/justificaciones/list-solicitudes-justificaciones-alumnos' },
            { label: 'Marcar Justificaciones', link: '/home/justificaciones/actualizar-estado-justificaciones' },
          ],
        },
        { isSeparator: true },
        {
          icon: 'users',
          label: 'Usuarios',
          link: '#',
          allowedRoles: ['DIRECTOR', 'ADMINISTRADOR', 'ADMIN'],
          children: [
            { label: 'Lista Usuarios', link: '/home/usuarios/lista-usuarios' },
            { label: 'Crear Usuario', link: '/home/usuarios/create-usuario' },
          ]
        },
        {
          icon: 'user-check',
          label: 'Administración de Personal',
          link: '#',
          allowedRoles: ['DIRECTOR', 'ADMINISTRADOR', 'ADMIN'],
          children: [
            { label: 'Directores', link: '/home/usuarios/administracion-personal' },
          ]
        },
        {
          icon: 'log-in',
          label: 'Cerrar Sesion',
          link: '/login',
          allowedRoles: ['ADMIN', 'ADMINISTRADOR', 'DIRECTOR', 'AUXILIAR', 'ALUMNO'], // abierto a todos los roles
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
