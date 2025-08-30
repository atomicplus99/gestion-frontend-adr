import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { UsuarioService } from '../services/usuario.service';
import { CreateUsuarioDto, RolUsuario } from '../interfaces/usuario.interface';

@Component({
  selector: 'app-create-usuario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-usuario.component.html',
  styleUrls: ['./create-usuario.component.css']
})
export class CreateUsuarioComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private usuarioService = inject(UsuarioService);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  // Formulario
  usuarioForm: FormGroup;
  
  // Estado
  loading = false;
  usuarioCreado = false;
  usuarioId: string | null = null;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  
  // Mensajes
  successMessage = '';
  errorMessage = '';
  
  // Opciones de roles
  roles = [
    { value: RolUsuario.ADMIN, label: 'Super Administrador' },
    { value: RolUsuario.ADMINISTRADOR, label: 'Administrador' },
    { value: RolUsuario.DIRECTOR, label: 'Director' },
    { value: RolUsuario.AUXILIAR, label: 'Auxiliar' },
    { value: RolUsuario.ALUMNO, label: 'Alumno' }
  ];

  constructor() {
    this.usuarioForm = this.fb.group({
      nombre_usuario: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      rol: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    // El formulario ya está inicializado en el constructor
    
    // Escuchar cambios en el nombre de usuario para limpiar errores
    this.usuarioForm.get('nombre_usuario')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(username => {
        this.verificarUsuarioExistente(username);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Validador personalizado para verificar que las contraseñas coincidan
   */
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    if (confirmPassword?.errors?.['passwordMismatch']) {
      delete confirmPassword.errors['passwordMismatch'];
      if (Object.keys(confirmPassword.errors).length === 0) {
        confirmPassword.setErrors(null);
      }
    }
    
    return null;
  }

  /**
   * Manejar selección de archivo
   */
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validar tipo de archivo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        this.errorMessage = 'Tipo de archivo no soportado. Solo se permiten: JPG, PNG, GIF, WebP';
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.errorMessage = 'El archivo es demasiado grande. Máximo 5MB';
        return;
      }

      // Validar tamaño mínimo (1KB)
      if (file.size < 1024) {
        this.errorMessage = 'El archivo es demasiado pequeño. Mínimo 1KB';
        return;
      }

      this.selectedFile = file;
      this.errorMessage = '';
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
      };
      reader.onerror = (error) => {
        this.errorMessage = 'Error al leer el archivo seleccionado';
      };
      reader.readAsDataURL(file);
    }
  }

  /**
   * Remover imagen seleccionada
   */
  removeImage(): void {
    this.selectedFile = null;
    this.previewUrl = null;
  }

  /**
   * Obtener placeholder para preview de imagen
   */
  getImagePlaceholder(): string {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjUwIiBjeT0iMzUiIHI9IjE1IiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0yMCA4MEMyMCA2NS42NDA2IDMxLjY0MDYgNTQgNDYgNTRINTRDNjguMzU5NCA1NCA4MCA2NS42NDA2IDgwIDgwVjEwMEgyMFY4MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';
  }

  /**
   * Manejar error de carga de imagen
   */
  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target && target.src !== this.getImagePlaceholder()) {
      target.src = this.getImagePlaceholder();
    }
  }

  /**
   * Obtener mensaje de error para un campo
   */
  getFieldError(fieldName: string): string {
    const field = this.usuarioForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} es requerido`;
      }
      if (field.errors['minlength']) {
        return `${this.getFieldLabel(fieldName)} debe tener al menos ${field.errors['minlength'].requiredLength} caracteres`;
      }
      if (field.errors['maxlength']) {
        return `${this.getFieldLabel(fieldName)} no puede tener más de ${field.errors['maxlength'].requiredLength} caracteres`;
      }
      if (field.errors['passwordMismatch']) {
        return 'Las contraseñas no coinciden';
      }
    }
    return '';
  }

  /**
   * Obtener etiqueta del campo
   */
  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      'nombre_usuario': 'Nombre de usuario',
      'password': 'Contraseña',
      'confirmPassword': 'Confirmar contraseña',
      'rol': 'Rol'
    };
    return labels[fieldName] || fieldName;
  }

  /**
   * Verificar si un campo tiene error
   */
  hasFieldError(fieldName: string): boolean {
    const field = this.usuarioForm.get(fieldName);
    return !!(field?.errors && field.touched);
  }

  /**
   * Obtener clase CSS para campo con error
   */
  getFieldClass(fieldName: string): string {
    return this.hasFieldError(fieldName) 
      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500';
  }

  /**
   * Enviar formulario - Crear usuario sin foto
   */
  onSubmit(): void {
    if (this.usuarioForm.valid) {
      this.loading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const formData = this.usuarioForm.value;
      const usuarioData: CreateUsuarioDto = {
        nombre_usuario: formData.nombre_usuario,
        password: formData.password,
        rol: formData.rol
      };

      this.usuarioService.crearUsuario(usuarioData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.loading = false;
            this.usuarioCreado = true;
            this.usuarioId = response.data?.id_user || null;
            this.successMessage = 'Usuario creado exitosamente. Ahora puedes subir una foto de perfil.';
            
            // Forzar detección de cambios
            this.cdr.detectChanges();
          },
          error: (error) => {
            // Manejar diferentes tipos de errores
            if (error.status === 409 || error.error?.message?.includes('ya existe') || error.error?.message?.includes('duplicate')) {
              this.errorMessage = 'El nombre de usuario ya existe. Por favor, elige otro nombre de usuario.';
            } else if (error.status === 400) {
              this.errorMessage = error.error?.message || 'Datos inválidos. Verifica la información ingresada.';
            } else if (error.status === 500) {
              this.errorMessage = 'Error interno del servidor. Intenta nuevamente.';
            } else {
              this.errorMessage = error.error?.message || 'Error al crear el usuario';
            }
            
            this.loading = false;
            this.cdr.detectChanges();
          }
        });
    } else {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.usuarioForm.controls).forEach(key => {
        this.usuarioForm.get(key)?.markAsTouched();
      });
    }
  }





  /**
   * Finalizar proceso sin subir foto
   */
  finalizarSinFoto(): void {
    this.successMessage = 'Usuario creado exitosamente';
    
    // Limpiar todo el formulario después de completar el proceso
    setTimeout(() => {
      this.resetForm();
    }, 3000);
  }

  /**
   * Subir foto de perfil
   */
  subirFoto(): void {
    if (!this.selectedFile || !this.usuarioId) {
      this.errorMessage = 'No hay archivo seleccionado o usuario no creado';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.usuarioService.subirFotoPerfil(this.usuarioId, this.selectedFile)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading = false;
          this.successMessage = 'Usuario creado y foto de perfil subida exitosamente';
          
          // Limpiar todo el formulario después de completar el proceso
          setTimeout(() => {
            this.resetForm();
          }, 3000);
        },
        error: (error) => {
          this.loading = false;
          
          // Mostrar mensaje más específico según el tipo de error
          if (error.status === 0) {
            this.errorMessage = 'Error de conexión. Verifica que el servidor esté funcionando.';
          } else if (error.status === 400) {
            this.errorMessage = 'Error al procesar la imagen. Verifica que el archivo sea una imagen válida.';
          } else if (error.status === 413) {
            this.errorMessage = 'La imagen es demasiado grande. Máximo 5MB.';
          } else if (error.status === 415) {
            this.errorMessage = 'Tipo de archivo no soportado. Solo se permiten imágenes.';
          } else if (error.status === 404) {
            this.errorMessage = 'Usuario no encontrado.';
          } else if (error.status === 500) {
            this.errorMessage = 'Error interno del servidor al procesar la imagen.';
          } else {
            this.errorMessage = `Error al subir la foto (${error.status}).`;
          }
          
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Resetear formulario
   */
  resetForm(): void {
    this.usuarioForm.reset();
    this.usuarioCreado = false;
    this.usuarioId = null;
    this.selectedFile = null;
    this.previewUrl = null;
    
    // Forzar detección de cambios
    this.cdr.detectChanges();
    
    // Limpiar mensajes después de 5 segundos
    setTimeout(() => {
      this.successMessage = '';
      this.errorMessage = '';
      this.cdr.detectChanges();
    }, 5000);
  }

  /**
   * Obtener mensaje de error para un campo
   */
  getErrorMessage(fieldName: string): string {
    const control = this.usuarioForm.get(fieldName);
    if (control && control.errors && control.touched) {
      if (control.errors['required']) {
        return 'Este campo es requerido';
      }
      if (control.errors['minlength']) {
        return `Mínimo ${control.errors['minlength'].requiredLength} caracteres`;
      }
      if (control.errors['pattern']) {
        return 'Formato inválido';
      }
      if (control.errors['usernameExists']) {
        return 'Este nombre de usuario ya existe';
      }
    }
    return '';
  }

  /**
   * Verificar si el nombre de usuario ya existe
   */
  private verificarUsuarioExistente(username: string): void {
    if (!username || username.length < 3) return;

    // Limpiar el error si el usuario cambia el nombre
    if (this.errorMessage && this.errorMessage.includes('ya existe')) {
      this.errorMessage = '';
    }
  }

  /**
   * Probar conectividad con el servidor
   */
  probarConectividad(): void {
    this.loading = true;
    this.errorMessage = '';

    this.usuarioService.probarConectividad()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading = false;
          this.successMessage = 'Conectividad con el servidor exitosa';
          this.cdr.detectChanges();
          setTimeout(() => {
            this.successMessage = '';
            this.cdr.detectChanges();
          }, 3000);
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = `Error de conectividad: ${error.status} - ${error.statusText}`;
          this.cdr.detectChanges();
          setTimeout(() => {
            this.errorMessage = '';
            this.cdr.detectChanges();
          }, 5000);
        }
      });
  }
}
