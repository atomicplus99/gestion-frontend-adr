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
        canActivate: [authGuard]
    },

    {
        path: 'login',
        component: LoginPageComponent
    },


];
