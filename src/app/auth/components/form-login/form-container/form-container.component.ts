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
    console.log('🚀 FormContainer: Iniciando submit del formulario');
    
    const { username, password } = this.formLogin.value;
    console.log('📝 Datos del formulario extraídos:', { username, passwordLength: password?.length });
    
    if (!username || !password) {
      console.error('❌ Datos faltantes:', { username: !!username, password: !!password });
      this.alertsService.error('Usuario y contraseña son requeridos');
      return;
    }
  
    console.log('📞 Llamando al LoginService...');
    this.loginService.login(username!, password!).subscribe({
      next: async (response) => {
        console.log('✅ FormContainer: Login exitoso');
        console.log('📥 Respuesta completa:', response);
        
        const { message, user } = response;
        console.log('👤 Usuario recibido:', user);
        console.log('💬 Mensaje:', message);
        
        this.userStore.setUser(user);
        this.alertsService.success(message || 'Login exitoso');
        
        console.log('🧭 Navegando a /home/welcome');
        const navigationResult = this.route.navigate(['/home/welcome']);
        console.log('🔍 Resultado de navegación:', navigationResult);
        
        navigationResult.then(success => {
          console.log('✅ Navegación exitosa:', success);
          if (!success) {
            console.error('❌ La navegación falló');
          }
        }).catch(error => {
          console.error('💥 Error en navegación:', error);
        });
      },
      error: (err) => {
        console.error('❌ FormContainer: Error en el login');
        console.error('🔥 Error completo:', err);
        console.error('📄 Status:', err.status);
        console.error('💬 Message:', err.error?.message);
        console.error('📊 Error object:', err.error);
        
        const errorMessage = err.error?.message || `Error de autenticación (${err.status})`;
        this.alertsService.error(errorMessage);
      }
    });
  
    console.log('🔄 Reseteando formulario');
    this.formLogin.reset();
  }
  

  

  


}
