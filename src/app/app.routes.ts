import { Routes } from '@angular/router';
import { LoginPageComponent } from './auth/pages/login/login.component';
import { MainPageComponent } from './gestion-academica-ar/pages/main/mainPage.component';
import { authGuard } from './auth/guards/auth.guard';
import { redirectedGuard } from './auth/guards/redirected.guard';
import { RedirectedPlaceholderComponent } from './common/utils/placeholder/redirected-placeholder/redirected-placeholder.component';
import { ManualRegisterComponent } from './gestion-academica-ar/pages/register/manualRegister/manualRegister.component';

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
                loadComponent: () => import('./gestion-academica-ar/pages/welcome/main-welcome/main-welcome.component').then(m => m.MainWelcomeComponent),

            },
            {
                path: 'registrar',
                children: [
                    {
                        path: 'manual',
                        loadComponent: () => import('./gestion-academica-ar/pages/register/manualRegister/manualRegister.component').then(m => m.ManualRegisterComponent),
                    },
                    {
                        path: 'excel',
                        loadComponent: () => import('./gestion-academica-ar/pages/register/excel/excel.component').then(m => m.ExcelComponent),
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
                        path: '', redirectTo: 'manual', pathMatch: 'full',
                    }
                ]
            },
            {
                path: 'asistencia',
                children: [
                    {
                        path: 'register-manual-alumnos',
                        loadComponent: () => import('./gestion-academica-ar/pages/asistencia/create-asistencia-alumno/create-asistencia-alumno.component').then(m => m.CreateAsistenciaAlumnoComponent),

                    },
                    {
                        path: 'list-asistencia-alumnos',
                        loadComponent: () => import('./gestion-academica-ar/pages/asistencia/list-asistencia-alumnos/main-component/list-asistencia-alumnos.component').then(m => m.ListAsistenciaAlumnosComponent),
                    },
                    {
                        path: 'update-asistencia-alumnos',
                        loadComponent: () => import('./gestion-academica-ar/pages/asistencia/update-asistencia-alumnos/update-asistencia-alumnos.component').then(m => m.UpdateAsistenciaAlumnosComponent),
                    },
                    {
                        path: 'delete-asistencia-alumnos',
                        loadComponent: () => import('./gestion-academica-ar/pages/asistencia/delete-asistencia-alumnos/delete-asistencia-alumnos.component').then(m => m.DeleteAsistenciaAlumnosComponent),
                    },
                ]
            },
            {
                path: '',
                redirectTo: 'registrar',
                pathMatch: 'full'
            }
        ]
    },

    {
        path: 'login',
        component: LoginPageComponent
    },


];
