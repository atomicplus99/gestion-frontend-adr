import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormFieldComponent } from "../form-field/form-field.component";
import { FormCheckboxComponent } from "../form-checkbox/form-checkbox.component";
import { FormButtonComponent } from "../form-button/form-button.component";
import { AlertsService } from '../../../../shared/alerts.service';
import { LoginService } from '../../../services/login.service';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

import { UserInfo } from '../../../interfaces/user-info.interface';
import { UserStoreService } from '../../../store/user.store';




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
    if (this.formLogin.invalid) {
      this.alertsService.error('Por favor complete todos los campos correctamente');
      return;
    }

    const { username, password } = this.formLogin.value;
    console.log('🚀 [FORM] Iniciando login desde formulario...');
    console.log('🚀 [FORM] Username:', username);
  
    this.loginService.login(username!, password!).subscribe({
      next: (response) => {
        console.log('✅ [FORM] Login exitoso, estableciendo usuario en store...');
        if (response && response.user) {
          this.userStore.setUser(response.user);
          this.alertsService.success(response.message || 'Inicio de sesión exitoso');
          this.route.navigate(['/home/welcome']);
        } else {
          this.alertsService.error('Error en la respuesta del servidor');
        }
      },
      error: (err) => {
        console.error('❌ [FORM] Error en login:', err);
        const errorMessage = err?.error?.message || err?.message || 'Error de autenticación';
        this.alertsService.error(errorMessage);
      }
    });
  
    this.formLogin.reset();
  }
  

  

  


}
