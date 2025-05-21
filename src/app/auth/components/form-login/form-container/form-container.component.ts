import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormFieldComponent } from "../form-field/form-field.component";
import { FormCheckboxComponent } from "../form-checkbox/form-checkbox.component";
import { FormButtonComponent } from "../form-button/form-button.component";
import { AlertsService } from '../../../../shared/alerts.service';
import { LoginService } from '../../../services/login.service';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Route, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { firstValueFrom } from 'rxjs';
import { UserInfo } from '../../../interfaces/user-info.interface';
import { UserStoreService } from '../../../store/user.store';
import { AppInitService } from '../../../../core/services/app-init.service';




@Component({
  selector: 'gestion-form-container',
  standalone: true,
  imports: [ReactiveFormsModule, FormFieldComponent, FormCheckboxComponent, FormButtonComponent, HttpClientModule, CommonModule],
  templateUrl: './form-container.component.html',
  styleUrl: './form-container.component.css',
})
export class FormContainerComponent {

  constructor(
              private userStore: UserStoreService,
              private appInitService: AppInitService,
              private alertsService: AlertsService, 
              private loginService: LoginService,
              private authService: AuthService,
              private route:Router
            ){

  }  
  formLogin =  new FormGroup({
    username: new FormControl('', 
      [ Validators.required, Validators.minLength(5)]),
    password: new FormControl('', 
      [ Validators.required, Validators.minLength(5) ]),
    rememberUser: new FormControl(false)
  })

  get usernameControl(): FormControl {
    return this.formLogin.get('username') as FormControl;
  }

  get passwordControl(): FormControl {
    return this.formLogin.get('password') as FormControl;
  }

  get rememberUserControl(): FormControl {
    return this.formLogin.controls['rememberUser'];
  }

  onSubmit() {
    const { username, password } = this.formLogin.value;
  
    this.loginService.login(username!, password!).subscribe({
      next: async (response) => {
        const { message, user } = response;
        this.userStore.setUser(user);
        this.alertsService.success(message);
        this.route.navigate(['/home']);
      },
      error: (err) => {
        this.alertsService.error(err.error?.message || 'Error de autenticación');
      }
    });
  
    this.formLogin.reset();
  }
  

  

  


}
