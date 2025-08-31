import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { UsuarioService } from '../../../gestion-academica-ar/pages/usuarios/services/usuario.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly usuarioService = inject(UsuarioService);
  private readonly destroy$ = new Subject<void>();

  resetForm!: FormGroup;
  token: string = '';
  loading = false;
  success = false;
  error = '';

  private background = signal({
    image: 'assets/front-page/front-page-ar.jpg',
    alt: 'background-colegio'
  });

  ngOnInit(): void {
    this.initializeForm();
    this.extractTokenFromUrl();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.resetForm = this.fb.group({
      passwordNueva: ['', [Validators.required, Validators.minLength(8)]],
      confirmarPassword: ['', [Validators.required, Validators.minLength(8)]]
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('passwordNueva');
    const confirmPassword = form.get('confirmarPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    if (confirmPassword?.hasError('passwordMismatch')) {
      confirmPassword.setErrors(null);
    }
    
    return null;
  }

  private extractTokenFromUrl(): void {
    this.route.queryParams.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      this.token = params['token'];
      if (!this.token) {
        this.error = 'Token de restablecimiento no válido o faltante';
      }
    });
  }

  onSubmit(): void {
    if (this.resetForm.invalid) {
      this.error = '⚠️ Por favor, completa todos los campos correctamente y verifica que las contraseñas coincidan';
      return;
    }

    if (!this.token) {
      this.error = '❌ Token de restablecimiento no válido';
      return;
    }

    this.loading = true;
    this.error = '';

    const { passwordNueva } = this.resetForm.value;

    this.usuarioService.resetPassword({ token: this.token, passwordNueva }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: any) => {
        this.loading = false;
        if (response.success) {
          this.success = true;
          // Redirigir al login después de 3 segundos
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 3000);
        } else {
          this.error = response.message || 'Error al restablecer la contraseña';
        }
      },
      error: (error: any) => {
        this.loading = false;
        console.error('Error al restablecer contraseña:', error);
        
        let errorMessage = 'Error al restablecer la contraseña';
        
        if (error?.error?.message) {
          errorMessage = error.error.message;
        } else if (error?.status === 400) {
          errorMessage = '❌ Token inválido o expirado. Solicita un nuevo enlace de restablecimiento.';
        } else if (error?.status === 500) {
          errorMessage = '❌ Error del servidor. Intenta nuevamente más tarde.';
        }
        
        this.error = errorMessage;
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goToForgotPassword(): void {
    this.router.navigate(['/forgot-password']);
  }

  get getBackground() {
    return this.background;
  }

  // Getters para el template
  get passwordNueva() { return this.resetForm.get('passwordNueva'); }
  get confirmarPassword() { return this.resetForm.get('confirmarPassword'); }
}
