import { Routes } from '@angular/router';
import { LoginPageComponent } from './auth/pages/login/login.component';
import { MainPageComponent } from './gestion-academica-ar/pages/main/mainPage.component';
import { authGuard } from './auth/guards/auth.guard';
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
        canActivate: [authGuard],
        children: [

            {
                path: 'welcome',
                loadComponent: () => import('./gestion-academica-ar/pages/welcome/main-welcome/main-welcome.component').then(m => m.WelcomeComponent),

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
                   
                ]
            },
            {
                path: 'asistencia',
                children: [
                    {
                        path: 'register-manual-alumnos',
                        loadComponent: () => import('./gestion-academica-ar/pages/asistencia/create-asistencia-alumno/create-asistencia-alumno.component').then(m => m.RegistroAsistenciaComponent),

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


];
