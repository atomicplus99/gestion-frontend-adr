import { Component, OnInit, OnDestroy, inject, signal, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { UserStoreService } from '../../../auth/store/user.store';
import { AuthService } from '../../../auth/services/auth.service';
import { UsuarioService } from '../usuarios/services/usuario.service';
import { PhotoService } from '../../../shared/services/photo.service';
import { UserInfo } from '../../../auth/interfaces/user-info.interface';
import { AlertsService } from '../../../shared/alerts.service';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.css']
})
export class PerfilComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly userStore = inject(UserStoreService);
  private readonly authService = inject(AuthService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly photoService = inject(PhotoService);
  private readonly alertsService = inject(AlertsService);
  private readonly http = inject(HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  // Signals
  readonly user = computed(() => this.userStore.user());
  readonly userInfo = signal<UserInfo | null>(null);
  readonly loading = signal<boolean>(false);
  readonly saving = signal<boolean>(false);
  readonly uploadingPhoto = signal<boolean>(false);
  readonly photoUrl = signal<string>('');
  readonly previewPhoto = signal<string>('');
  readonly showPasswordForm = signal<boolean>(false);
  readonly changingPassword = signal<boolean>(false);

  // Formularios
  usuarioForm!: FormGroup;
  personalForm!: FormGroup;
  passwordForm!: FormGroup;

  // Archivo seleccionado
  archivoSeleccionado: File | null = null;

  ngOnInit(): void {
    this.initializeForms();
    // Inicializar formulario personal vacío para evitar errores
    this.personalForm = this.fb.group({});
    this.initializePasswordForm();
    this.loadUserData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForms(): void {
    // Formulario de datos de usuario
    this.usuarioForm = this.fb.group({
      nombre_usuario: ['', [Validators.required, Validators.minLength(3)]],
      activo: [true]
    });

    // Formulario de datos personales (se inicializa según el rol)
    this.personalForm = this.fb.group({});
  }

  private initializePasswordForm(): void {
    this.passwordForm = this.fb.group({
      passwordActual: ['', [Validators.required, Validators.minLength(8)]],
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

  private loadUserData(): void {
    this.loading.set(true);
    
    const user = this.user();
    if (!user?.idUser) {
      this.mostrarNotificacionUsuario('No se pudo obtener la información del usuario', 'error');
      this.loading.set(false);
      return;
    }

    // Obtener datos del usuario directamente (con cache busting)
    const timestamp = Date.now();
    this.usuarioService.obtenerUsuarioPorId(user.idUser).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          const userData = response.data;
          // Preservar la foto existente del userStore
          const existingUser = this.userStore.getUserSilently();
          const initialUserInfo = {
            idUser: user.idUser,
            username: userData.nombre_usuario,
            role: userData.rol_usuario,
            photo: existingUser?.photo || '' // Preservar foto existente
          } as UserInfo;
          
          this.userInfo.set(initialUserInfo);
          // Actualizar el userStore con los datos iniciales (preservando foto)
          this.userStore.setUser(initialUserInfo);
          
          // Forzar detección de cambios
          this.cdr.detectChanges();
          // Cargar datos de la entidad según el rol
          this.loadEntityData(userData.rol_usuario, user.idUser);
          this.loadUserPhoto();
        } else {
          this.mostrarNotificacionUsuario('Error al cargar los datos del usuario', 'error');
          this.loading.set(false);
        }
      },
      error: (error: any) => {
        console.error('Error al cargar datos del usuario:', error);
        this.mostrarNotificacionUsuario('Error al cargar los datos del usuario', 'error');
        this.loading.set(false);
      }
    });
  }

  private loadEntityData(role: string, userId: string): void {
    let endpoint = '';
    
    switch (role) {
      case 'ADMINISTRADOR':
        endpoint = `${environment.apiUrl}/usuarios/${userId}/administrador`;
        break;
      case 'DIRECTOR':
        endpoint = `${environment.apiUrl}/usuarios/${userId}/director`;
        break;
      case 'AUXILIAR':
        endpoint = `${environment.apiUrl}/usuarios/${userId}/auxiliar`;
        break;
      case 'ALUMNO':
        endpoint = `${environment.apiUrl}/usuarios/${userId}/alumno`;
        break;
      default:
        this.loading.set(false);
        return;
    }

    // Cache busting
    const timestamp = Date.now();
    this.http.get(endpoint).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          // Agregar los datos de la entidad al userInfo
          const currentUserInfo = this.userInfo();
          if (currentUserInfo) {
            const updatedUserInfo = { ...currentUserInfo };
            switch (role) {
              case 'ADMINISTRADOR':
                updatedUserInfo.administrador = response.data;
                break;
              case 'DIRECTOR':
                updatedUserInfo.director = response.data;
                break;
              case 'AUXILIAR':
                updatedUserInfo.auxiliar = response.data;
                break;
              case 'ALUMNO':
                updatedUserInfo.alumno = response.data;
                break;
            }
            this.userInfo.set(updatedUserInfo);
            this.populateForms(updatedUserInfo);
            // Actualizar el userStore inmediatamente con los datos completos
            this.userStore.setUser(updatedUserInfo);
            // Forzar detección de cambios
            this.cdr.detectChanges();
          }
        }
        this.loading.set(false);
      },
      error: (error: any) => {
        console.error('Error al cargar datos de la entidad:', error);
        this.mostrarNotificacionUsuario('Error al cargar los datos personales', 'error');
        this.loading.set(false);
      }
    });
  }

  private populateForms(userInfo: UserInfo): void {
    // Llenar formulario de usuario
    this.usuarioForm.patchValue({
      nombre_usuario: userInfo.username,
      activo: true // Los usuarios siempre están activos
    });

    // Llenar formulario personal según el rol
    this.initializePersonalForm(userInfo);
  }

  private initializePersonalForm(userInfo: UserInfo): void {

    const personalData: any = {};

    switch (userInfo.role) {
      case 'DIRECTOR':

        if (userInfo.director) {
          personalData.nombres = userInfo.director.nombres;
          personalData.apellidos = userInfo.director.apellidos;
          personalData.dni_director = userInfo.director.dni_director;
          personalData.correo_electronico = userInfo.director.correo_electronico;
          personalData.telefono = userInfo.director.telefono;
        }
        break;
      case 'ADMINISTRADOR':

        if (userInfo.administrador) {
          personalData.nombres = userInfo.administrador.nombres;
          personalData.apellidos = userInfo.administrador.apellidos;
          personalData.email = userInfo.administrador.email;
          personalData.telefono = userInfo.administrador.telefono;
          personalData.direccion = userInfo.administrador.direccion;
        }
        break;
      case 'AUXILIAR':
        if (userInfo.auxiliar) {
          personalData.nombre = userInfo.auxiliar.nombre;
          personalData.apellido = userInfo.auxiliar.apellido;
          personalData.dni_auxiliar = userInfo.auxiliar.dni_auxiliar;
          personalData.correo_electronico = userInfo.auxiliar.correo_electronico;
          personalData.telefono = userInfo.auxiliar.telefono;
        }
        break;
      case 'ALUMNO':
        if (userInfo.alumno) {
          personalData.nombre = userInfo.alumno.nombre;
          personalData.apellido = userInfo.alumno.apellido;
          personalData.dni_alumno = userInfo.alumno.dni_alumno;
          personalData.fecha_nacimiento = userInfo.alumno.fecha_nacimiento;
          personalData.direccion = userInfo.alumno.direccion;
        }
        break;
    }

    // Crear formulario con validadores apropiados
    const newForm = this.createPersonalForm(userInfo.role, personalData);
    
    // Actualizar el formulario existente con los nuevos controles
    Object.keys(newForm.controls).forEach(key => {
      if (this.personalForm.contains(key)) {
        this.personalForm.removeControl(key);
      }
      this.personalForm.addControl(key, newForm.get(key)!);
    });
    
    // Forzar detección de cambios para que el HTML reconozca el formulario
    this.cdr.detectChanges();
  }

  private createPersonalForm(role: string, data: any): FormGroup {
    const formConfig: any = {};

    switch (role) {
      case 'DIRECTOR':
        formConfig.nombres = [data.nombres || '', [Validators.required, Validators.minLength(2)]];
        formConfig.apellidos = [data.apellidos || '', [Validators.required, Validators.minLength(2)]];
        formConfig.dni_director = [data.dni_director || '', [Validators.required, Validators.pattern(/^\d{8}$/)]];
        formConfig.correo_electronico = [data.correo_electronico || '', [Validators.required, Validators.email]];
        formConfig.telefono = [data.telefono || '', [Validators.required, Validators.pattern(/^\d{9}$/)]];
        break;
      case 'ADMINISTRADOR':
        formConfig.nombres = [data.nombres || '', [Validators.required, Validators.minLength(2)]];
        formConfig.apellidos = [data.apellidos || '', [Validators.required, Validators.minLength(2)]];
        formConfig.email = [data.email || '', [Validators.required, Validators.email]];
        formConfig.telefono = [data.telefono || '', [Validators.required, Validators.pattern(/^\d{9}$/)]];
        formConfig.direccion = [data.direccion || '', [Validators.required, Validators.minLength(5)]];
        break;
      case 'AUXILIAR':
        formConfig.nombre = [data.nombre || '', [Validators.required, Validators.minLength(2)]];
        formConfig.apellido = [data.apellido || '', [Validators.required, Validators.minLength(2)]];
        formConfig.dni_auxiliar = [data.dni_auxiliar || '', [Validators.required, Validators.pattern(/^\d{8}$/)]];
        formConfig.correo_electronico = [data.correo_electronico || '', [Validators.required, Validators.email]];
        formConfig.telefono = [data.telefono || '', [Validators.required, Validators.pattern(/^\d{9}$/)]];
        break;
      case 'ALUMNO':
        formConfig.nombre = [data.nombre || '', [Validators.required, Validators.minLength(2)]];
        formConfig.apellido = [data.apellido || '', [Validators.required, Validators.minLength(2)]];
        formConfig.dni_alumno = [data.dni_alumno || '', [Validators.required, Validators.pattern(/^\d{8}$/)]];
        formConfig.fecha_nacimiento = [data.fecha_nacimiento || '', [Validators.required]];
        formConfig.direccion = [data.direccion || '', [Validators.required, Validators.minLength(5)]];
        break;
    }

    return this.fb.group(formConfig);
  }

  private loadUserPhoto(): void {
    const user = this.user();
    if (user?.idUser) {
      // Cache busting para la foto
      const timestamp = Date.now();
      this.usuarioService.obtenerUrlFotoPerfil(user.idUser).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (response) => {
          if (response.success && response.data?.foto_url) {
            this.photoUrl.set(response.data.foto_url);
            // Actualizar la foto en el userStore también
            const currentUserInfo = this.userInfo();
            if (currentUserInfo) {
              const updatedUserInfo = { ...currentUserInfo, photo: response.data.foto_url };
              this.userInfo.set(updatedUserInfo);
              this.userStore.setUser(updatedUserInfo);

            }
          } else {
            this.photoUrl.set('assets/default-avatar.png');
            // Actualizar con foto por defecto en el userStore
            const currentUserInfo = this.userInfo();
            if (currentUserInfo) {
              const updatedUserInfo = { ...currentUserInfo, photo: 'assets/default-avatar.png' };
              this.userInfo.set(updatedUserInfo);
              this.userStore.setUser(updatedUserInfo);
            }
          }
          // Forzar detección de cambios
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error al cargar foto:', error);
          this.photoUrl.set('assets/default-avatar.png');
        }
      });
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        this.mostrarNotificacionUsuario('Por favor selecciona un archivo de imagen válido', 'error');
        return;
      }

      // Validar tamaño (5MB máximo)
      if (file.size > 5 * 1024 * 1024) {
        this.mostrarNotificacionUsuario('El archivo no puede ser mayor a 5MB', 'error');
        return;
      }

      this.archivoSeleccionado = file;
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewPhoto.set(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }

  actualizarFoto(): void {
    if (!this.archivoSeleccionado || !this.user()?.idUser) {
      this.mostrarNotificacionUsuario('Por favor selecciona una imagen', 'error');
      return;
    }

    this.uploadingPhoto.set(true);

    const formData = new FormData();
    formData.append('file', this.archivoSeleccionado);

    this.http.post(`${environment.apiUrl}/usuarios/${this.user()!.idUser}/foto`, formData).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.mostrarNotificacionUsuario('Foto actualizada exitosamente', 'success');
          this.archivoSeleccionado = null;
          this.previewPhoto.set('');
          // Recargar datos completos desde el servidor
          this.recargarDatosCompletos();
        } else {
          this.mostrarNotificacionUsuario('Error al actualizar la foto', 'error');
        }
        this.uploadingPhoto.set(false);
      },
      error: (error) => {
        console.error('Error al subir foto:', error);
        this.mostrarNotificacionUsuario('Error al actualizar la foto', 'error');
        this.uploadingPhoto.set(false);
      }
    });
  }

  guardarCambios(): void {
    if (this.usuarioForm.invalid || this.personalForm.invalid) {
      this.mostrarNotificacionUsuario('Por favor completa todos los campos requeridos', 'error');
      return;
    }

    this.saving.set(true);

    // Actualizar datos de usuario
    const usuarioData = {
      nombre_usuario: this.usuarioForm.get('nombre_usuario')?.value,
      activo: this.usuarioForm.get('activo')?.value
    };

    this.usuarioService.actualizarUsuario(this.user()!.idUser, usuarioData).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        if (response.success) {
          // Actualizar datos personales según el rol
          this.actualizarDatosPersonales();
        } else {
          this.mostrarNotificacionUsuario('Error al actualizar los datos del usuario', 'error');
          this.saving.set(false);
        }
      },
      error: (error) => {
        console.error('Error al actualizar usuario:', error);
        this.mostrarNotificacionUsuario('Error al actualizar los datos del usuario', 'error');
        this.saving.set(false);
      }
    });
  }

  private actualizarDatosPersonales(): void {
    const userInfo = this.userInfo();
    if (!userInfo) {
      this.saving.set(false);
      return;
    }

    const personalData = this.personalForm.value;
    let endpoint = '';

    switch (userInfo.role) {
      case 'DIRECTOR':
        if (userInfo.director?.id_director) {
          endpoint = `${environment.apiUrl}/directores/${userInfo.director.id_director}`;
        }
        break;
      case 'ADMINISTRADOR':
        if (userInfo.administrador?.id_administrador) {
          endpoint = `${environment.apiUrl}/administradores/${userInfo.administrador.id_administrador}`;
        }
        break;
      case 'AUXILIAR':
        if (userInfo.auxiliar?.id_auxiliar) {
          endpoint = `${environment.apiUrl}/auxiliares/${userInfo.auxiliar.id_auxiliar}`;
        }
        break;
      case 'ALUMNO':
        if (userInfo.alumno?.id_alumno) {
          endpoint = `${environment.apiUrl}/alumnos/${userInfo.alumno.id_alumno}`;
        }
        break;
      default:
        this.saving.set(false);
        return;
    }

    if (!endpoint) {
      this.mostrarNotificacionUsuario('No se pudo obtener el ID de la entidad', 'error');
      this.saving.set(false);
      return;
    }

    this.http.patch(endpoint, personalData).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.mostrarNotificacionUsuario('Perfil actualizado exitosamente', 'success');
          // Recargar datos completos desde el servidor
          this.recargarDatosCompletos();
        } else {
          this.mostrarNotificacionUsuario('Error al actualizar los datos personales', 'error');
        }
        this.saving.set(false);
      },
      error: (error) => {
        console.error('Error al actualizar datos personales:', error);
        this.mostrarNotificacionUsuario('Error al actualizar los datos personales', 'error');
        this.saving.set(false);
      }
    });
  }

  private actualizarUserStore(): void {
    const user = this.user();
    const userInfo = this.userInfo();
    
    if (user && userInfo) {
      // Actualizar el userStore con los nuevos datos
      const updatedUser = {
        ...user,
        username: userInfo.username,
        // Actualizar datos específicos según el rol
        ...(userInfo.administrador && {
          administrador: userInfo.administrador
        }),
        ...(userInfo.director && {
          director: userInfo.director
        }),
        ...(userInfo.auxiliar && {
          auxiliar: userInfo.auxiliar
        }),
        ...(userInfo.alumno && {
          alumno: userInfo.alumno
        })
      };
      

      this.userStore.setUser(updatedUser);
    }
  }

  private actualizarFotoEnUserStore(): void {
    const user = this.user();
    if (user) {
      // Actualizar solo la foto en el userStore
      const updatedUser = {
        ...user,
        photo: this.photoUrl() // Usar la nueva URL de la foto
      };

      this.userStore.setUser(updatedUser);
    }
  }

  private recargarDatosCompletos(): void {
    // Recargar datos del usuario y entidad
    this.loadUserData();
    
    // Actualizar el userStore con los datos frescos del servidor
    setTimeout(() => {
      const userInfo = this.userInfo();
      if (userInfo) {
        this.userStore.setUser(userInfo);
        // Forzar detección de cambios
        this.cdr.detectChanges();
        
        // Disparar evento personalizado para notificar a otros componentes
        const event = new CustomEvent('userDataUpdated', {
          detail: { userInfo }
        });
        window.dispatchEvent(event);

      }
    }, 1000); // Esperar a que se carguen los datos
  }

  private notificarActualizacionFoto(): void {
    // Emitir un evento personalizado para notificar al ProfileComponent
    const event = new CustomEvent('photoUpdated', {
      detail: { photoUrl: this.photoUrl() }
    });
    window.dispatchEvent(event);
  }

  private mostrarNotificacionUsuario(mensaje: string, tipo: 'success' | 'error' | 'info'): void {
    switch (tipo) {
      case 'success':
        this.alertsService.success(mensaje);
        break;
      case 'error':
        this.alertsService.error(mensaje);
        break;
      case 'info':
        this.alertsService.info(mensaje);
        break;
    }
  }

  volver(): void {
    this.router.navigate(['/home/welcome']);
  }

  // ====================================
  // MÉTODOS DE CAMBIO DE CONTRASEÑA
  // ====================================

  togglePasswordForm(): void {
    this.showPasswordForm.set(!this.showPasswordForm());
    if (!this.showPasswordForm()) {
      this.passwordForm.reset();
    }
  }

  cambiarPassword(): void {
    if (this.passwordForm.invalid) {
      this.mostrarNotificacionUsuario('Por favor, completa todos los campos correctamente y verifica que las contraseñas coincidan', 'error');
      return;
    }

    const user = this.user();
    if (!user?.idUser) {
      this.mostrarNotificacionUsuario('No se pudo obtener la información del usuario', 'error');
      return;
    }

    this.changingPassword.set(true);

    const { passwordActual, passwordNueva } = this.passwordForm.value;
    const endpoint = `${environment.apiUrl}/usuarios/${user.idUser}/cambiar-password`;

    this.http.post(endpoint, {
      passwordActual,
      passwordNueva
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.mostrarNotificacionUsuario('¡Contraseña cambiada exitosamente! Tu nueva contraseña ya está activa.', 'success');
          this.passwordForm.reset();
          this.showPasswordForm.set(false);
        } else {
          this.mostrarNotificacionUsuario(response.message || 'Error al cambiar la contraseña', 'error');
        }
        this.changingPassword.set(false);
      },
      error: (error: any) => {
        console.error('Error al cambiar contraseña:', error);
        let errorMessage = 'Error al cambiar la contraseña';
        
        if (error?.error?.message) {
          errorMessage = error.error.message;
        } else if (error?.status === 400) {
          errorMessage = 'La contraseña actual es incorrecta. Verifica e intenta nuevamente.';
        } else if (error?.status === 401) {
          errorMessage = 'No tienes permisos para realizar esta acción.';
        } else if (error?.status === 500) {
          errorMessage = 'Error del servidor. Intenta nuevamente más tarde.';
        }
        
        this.mostrarNotificacionUsuario(errorMessage, 'error');
        this.changingPassword.set(false);
      }
    });
  }

  // Getters para el template
  get isDirector(): boolean {
    return this.user()?.role === 'DIRECTOR';
  }

  get isAdministrador(): boolean {
    return this.user()?.role === 'ADMINISTRADOR';
  }

  get isAuxiliar(): boolean {
    return this.user()?.role === 'AUXILIAR';
  }

  get isAlumno(): boolean {
    return this.user()?.role === 'ALUMNO';
  }

  get rolDisplay(): string {
    const role = this.user()?.role;
    switch (role) {
      case 'DIRECTOR': return 'Director';
      case 'ADMINISTRADOR': return 'Administrador';
      case 'AUXILIAR': return 'Auxiliar';
      case 'ALUMNO': return 'Alumno';
      default: return 'Usuario';
    }
  }

  // Getters para el formulario de contraseña
  get passwordActual() { return this.passwordForm.get('passwordActual'); }
  get passwordNueva() { return this.passwordForm.get('passwordNueva'); }
  get confirmarPassword() { return this.passwordForm.get('confirmarPassword'); }
}
