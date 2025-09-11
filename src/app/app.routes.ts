import { Routes } from '@angular/router';
import { LoginPageComponent } from './auth/pages/login/login.component';
import { MainPageComponent } from './gestion-academica-ar/pages/main/mainPage.component';
import { AuthGuard } from './auth/guards/auth.guard';
import { redirectedGuard } from './auth/guards/redirected.guard';
import { RedirectedPlaceholderComponent } from './common/utils/placeholder/redirected-placeholder/redirected-placeholder.component';

export const routes: Routes = [


    {
        path: '',
        component: RedirectedPlaceholderComponent, //utils
        canActivate: [redirectedGuard]
    },

    {
        path: 'home',
        component: MainPageComponent,
        canActivate: [AuthGuard],
        children: [

            {
                path: 'welcome',
                loadComponent: () => import('./gestion-academica-ar/pages/welcome/main-welcome/main-welcome.component').then(m => m.WelcomeComponent),

            },
            {
                path: 'terminos-condiciones',
                loadComponent: () => import('./shared/components/terminos-condiciones/terminos-condiciones.component').then(m => m.TerminosCondicionesComponent),

            },
            {
                path: 'registrar',
                children: [
                    {
                        path: 'manual',
                        loadComponent: () => import('./gestion-academica-ar/pages/register/register-alumno-manual/components/main/manual-register.component').then(m => m.ManualRegisterAlumnoComponent),
                    },
                    {
                        path: 'excel',
                        loadComponent: () => import('./gestion-academica-ar/pages/register/register-alumnos-excel/components/main/excel.component').then(m => m.ExcelComponent),
                    },
                    {
                        path: 'actualizar-alumno',
                        loadComponent: () => import('./gestion-academica-ar/pages/register/actualizar-alumno/actualizar-alumno.component').then(m => m.ActualizarAlumnoComponent),
                    },
                    {
                        path: 'delete-alumno',
                        loadComponent: () => import('./gestion-academica-ar/pages/register/deleteAlumno/deleteAlumno.component').then(m => m.DeleteAlumnoComponent),

                    },
                    {
                        path: 'list-alumno',
                        loadComponent: () => import('./gestion-academica-ar/pages/register/listAlumnos/listAlumnos.component').then(m => m.ListaAlumnosEstadoComponent),

                    },
                    {
                        path:'imprimir-qr-alumnos',
                        loadComponent: () => import('./gestion-academica-ar/pages/register/codigos-qr-alumnos/codigos-qr-alumnos.component').then(m => m.QrPrinterComponent),

                    },
                    {
                        path: '', redirectTo: 'manual', pathMatch: 'full',
                    }
                ]
            },
            {
                path: 'apoderado',
                children: [
                    {
                        path: 'register-apoderado',
                        loadComponent: () => import('./gestion-academica-ar/pages/apoderados/create-apoderado/create-apoderado.component').then(m => m.ApoderadoCreateFormComponent),
                    },
                    {
                        path: 'edit-apoderado',
                        loadComponent: () => import('./gestion-academica-ar/pages/apoderados/edit-apoderado/edit-apoderado.component').then(m => m.ApoderadoSearchAndEditComponent),
                    },
                    {
                        path: 'asign-apoderado',
                        loadComponent: () => import('./gestion-academica-ar/pages/apoderados/asigne-alumno/asigne-alumno.component').then(m => m.AssignStudentsComponent),
                    },
                    {
                        path: 'delete-apoderado',
                        loadComponent: () => import('./gestion-academica-ar/pages/apoderados/delete-apoderado/delete-apoderado.component').then(m => m.DeleteApoderadoComponent),
                    },
                    {
                        path: 'list-apoderados',
                        loadComponent: () => import('./gestion-academica-ar/pages/apoderados/list-apoderados/list-apoderados.component').then(m => m.ApoderadoListComponent),
                    },
                   
                ]
            },
            {
                path: 'asistencia',
                children: [
                    {
                        path: 'register-manual-alumnos',
                        loadComponent: () => import('./gestion-academica-ar/pages/asistencia/create-asistencia-alumno/components/main/register-asistencia-manual.component').then(m => m.RegistroAsistenciaComponentManual),

                    },
                    {
                        path: 'list-asistencia-alumnos',
                        loadComponent: () => import('./gestion-academica-ar/pages/asistencia/list-asistencia-alumnos/main-component/list-asistencia-alumnos.component').then(m => m.ListaAsistenciaComponent),
                    },
                    {
                        path: 'update-asistencia-alumnos',
                        loadComponent: () => import('./gestion-academica-ar/pages/asistencia/update-asistencia-alumnos/update-asistencia-alumnos.component').then(m => m.ActualizarAsistenciaComponent),
                    },
                    {
                        path: 'delete-asistencia-alumnos',
                        loadComponent: () => import('./gestion-academica-ar/pages/asistencia/delete-asistencia-alumnos/delete-asistencia-alumnos.component').then(m => m.AnularAsistenciasComponent),
                    },
                    {
                        path: 'create-ausencia-alumnos',
                        loadComponent: () => import('./gestion-academica-ar/pages/asistencia/create-ausencia-alumno/create-ausencia-alumno.component').then(m => m.RegistroAusenciasComponent),
                    },
                ]
            },
            {
                path: 'ausencias-masivas',
                children: [
                    {
                        path: 'programa',
                        loadComponent: () => import('./gestion-academica-ar/pages/ausencias-masivas/ausencias-masivas.component').then(m => m.AusenciasMasivasComponent),
                    },
                ]
            },
            {
                path: 'justificaciones',
                children: [
                    {
                        path: 'create-solicitud-justificacion',
                        loadComponent: () => import('./gestion-academica-ar/pages/justificaciones/create-solicitud-justificacion/create-solicitud-justificacion.component').then(m => m.SolicitudJustificacionComponent),
                    },
                    {
                        path: 'list-solicitudes-justificaciones-alumnos',
                        loadComponent: () => import('./gestion-academica-ar/pages/justificaciones/list-solicitudes-justificaciones-alumnos/list-solicitudes-justificaciones-alumnos.component').then(m => m.ListaJustificacionesComponent),
                    },
                    {
                        path: 'actualizar-estado-justificaciones',
                        loadComponent: () => import('./gestion-academica-ar/pages/justificaciones/actualizar-estado-justificaciones/actualizar-estado-justificaciones.component').then(m => m.GestionEstadosJustificacionesComponent),
                    },
                ]
            },
            {
                path: 'usuarios',
                children: [
                    {
                        path: 'create-usuario',
                        loadComponent: () => import('./gestion-academica-ar/pages/usuarios/create-usuario/create-usuario.component').then(m => m.CreateUsuarioComponent),
                    },
                    {
                        path: 'administracion-personal',
                        loadComponent: () => import('./gestion-academica-ar/pages/usuarios/administracion-personal/administracion-personal.component').then(m => m.AdministracionPersonalComponent),
                    },
                    {
                        path: 'lista-usuarios',
                        loadComponent: () => import('./gestion-academica-ar/pages/usuarios/lista-usuarios/lista-usuarios.component').then(m => m.ListaUsuariosComponent),
                    },
                    {
                        path: '',
                        redirectTo: 'create-usuario',
                        pathMatch: 'full'
                    }
                ]
            },
            {
                path: 'perfil',
                loadComponent: () => import('./gestion-academica-ar/pages/perfil/perfil.component').then(m => m.PerfilComponent),
            },
            {
                path: 'notifications/:id',
                loadComponent: () => import('./shared/components/notification-detail/notification-detail.component').then(m => m.NotificationDetailComponent),
            },
            {
                path: '',
                redirectTo: 'welcome',
                pathMatch: 'full'
            }
        ]
    },

    {
        path: 'login',
        component: LoginPageComponent
    },

    {
        path: 'forgot-password',
        loadComponent: () => import('./auth/components/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
    },

    {
        path: 'reset-password',
        loadComponent: () => import('./auth/components/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
    },


];
