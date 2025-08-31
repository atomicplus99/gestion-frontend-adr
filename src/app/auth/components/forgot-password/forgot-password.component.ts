import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { UsuarioService } from '../../../gestion-academica-ar/pages/usuarios/services/usuario.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly usuarioService = inject(UsuarioService);
  private readonly destroy$ = new Subject<void>();

  forgotForm!: FormGroup;
  loading = false;
  success = false;
  error = '';

  private background = signal({
    image: 'assets/front-page/front-page-ar.jpg',
    alt: 'background-colegio'
  });

  ngOnInit(): void {
    this.initializeForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.forgotForm.invalid) {
      this.error = '⚠️ Por favor, ingresa un email válido';
      return;
    }

    this.loading = true;
    this.error = '';

    const { email } = this.forgotForm.value;

    this.usuarioService.forgotPassword({ email }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: any) => {
        this.loading = false;
        if (response.success) {
          this.success = true;
        } else {
          this.error = response.message || 'Error al enviar el enlace de restablecimiento';
        }
      },
      error: (error: any) => {
        this.loading = false;
        console.error('Error al solicitar restablecimiento:', error);
        
        let errorMessage = 'Error al enviar el enlace de restablecimiento';
        
        if (error?.error?.message) {
          errorMessage = error.error.message;
        } else if (error?.status === 404) {
          errorMessage = '❌ No se encontró una cuenta asociada a este email';
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

  get getBackground() {
    return this.background;
  }

  // Getter para el template
  get email() { return this.forgotForm.get('email'); }
}
