import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { DirectorService } from '../../../services/director.service';
import { Director, CreateDirectorDto, UpdateDirectorDto, UsuarioDisponible, AsignarUsuarioDto, CambiarUsuarioDto } from '../../../interfaces/director.interface';
import { ErrorHandlerService, ErrorType } from '../../../../../../shared/services/error-handler.service';

@Component({
  selector: 'app-directores-crud',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './directores-crud.component.html',
  styleUrls: ['./directores-crud.component.css']
})
export class DirectoresCrudComponent implements OnInit, OnDestroy {
  @Input() directores: Director[] = [];
  @Input() loading = false;
  
  @Output() directorCreado = new EventEmitter<void>();
  @Output() directorActualizado = new EventEmitter<void>();
  @Output() directorEliminado = new EventEmitter<void>();

  private directorService = inject(DirectorService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private errorHandler = inject(ErrorHandlerService);
  private destroy$ = new Subject<void>();

  // Estado
  showCreateForm = false;
  showEditForm = false;
  showDeleteModal = false;
  showAssignModal = false;
  selectedDirector: Director | null = null;
  formLoading = false;
  
  // Validación de eliminación
  directorUsuarios: any[] = [];
  verificandoUsuarios = false;

  // Asignación de usuarios
  usuariosDisponibles: UsuarioDisponible[] = [];
  cargandoUsuarios = false;
  assignForm: FormGroup;
  
  // Formularios
  createForm: FormGroup;
  editForm: FormGroup;
  
  // Mensajes
  successMessage = '';
  errorMessage = '';

  constructor() {
    this.createForm = this.fb.group({
      nombres: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      apellidos: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
      telefono: ['', [Validators.maxLength(15)]],
      direccion: ['', [Validators.maxLength(200)]]
    });

    this.editForm = this.fb.group({
      nombres: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      apellidos: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
      telefono: ['', [Validators.maxLength(15)]],
      direccion: ['', [Validators.maxLength(200)]]
    });

    this.assignForm = this.fb.group({
      id_user: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    // El componente ya recibe los directores como input
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Mostrar formulario de creación
   */
  mostrarCrearFormulario(): void {
    this.showCreateForm = true;
    this.showEditForm = false;
    this.showDeleteModal = false;
    this.createForm.reset();
    this.clearMessages();
  }

  /**
   * Mostrar formulario de edición
   */
  mostrarEditarFormulario(director: Director): void {
    this.selectedDirector = director;
    this.showEditForm = true;
    this.showCreateForm = false;
    this.showDeleteModal = false;
    
    this.editForm.patchValue({
      nombres: director.nombres,
      apellidos: director.apellidos,
      email: director.email,
      telefono: director.telefono || '',
      direccion: director.direccion || ''
    });
    
    this.clearMessages();
  }

  /**
   * Mostrar modal de eliminación
   */
  mostrarEliminarModal(director: Director): void {
    this.selectedDirector = director;
    this.showDeleteModal = true;
    this.showCreateForm = false;
    this.showEditForm = false;
    this.clearMessages();
    
    // Verificar si el director tiene usuarios asignados
    this.verificarUsuariosAsignados(director.id_director);
  }

  /**
   * Cerrar todos los modales
   */
  cerrarModales(): void {
    this.showCreateForm = false;
    this.showEditForm = false;
    this.showDeleteModal = false;
    this.showAssignModal = false;
    this.selectedDirector = null;
    this.directorUsuarios = [];
    this.verificandoUsuarios = false;
    this.usuariosDisponibles = [];
    this.assignForm.reset();
    this.clearMessages();
  }

  /**
   * Crear director
   */
  crearDirector(): void {
    if (this.createForm.valid) {
      this.formLoading = true;
      this.errorMessage = '';

      const directorData: CreateDirectorDto = this.createForm.value;

      this.directorService.crearDirector(directorData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.formLoading = false;
            if (response.success) {
              this.successMessage = 'Director creado exitosamente';
              this.cerrarModales();
              this.directorCreado.emit();
            } else {
              this.errorMessage = response.message || 'Error al crear director';
            }
            this.cdr.detectChanges();
          },
                  error: (error) => {
          this.formLoading = false;
          this.errorHandler.addError({
            type: ErrorType.SERVER,
            title: 'Error al Crear Director',
            message: error.error?.message || 'No se pudo crear el director',
            retryable: true,
            action: {
              label: 'Reintentar',
              action: () => this.retryCrearDirector(),
              type: 'primary'
            }
          });
          this.cdr.detectChanges();
          
          // Forzar detección de cambios adicional
          setTimeout(() => {
            this.cdr.detectChanges();
          }, 100);
        }
        });
    } else {
      this.markFormGroupTouched(this.createForm);
    }
  }

  /**
   * Actualizar director
   */
  actualizarDirector(): void {
    if (this.editForm.valid && this.selectedDirector) {
      this.formLoading = true;
      this.errorMessage = '';

      const directorData: UpdateDirectorDto = this.editForm.value;

      this.directorService.actualizarDirector(this.selectedDirector.id_director, directorData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.formLoading = false;
            if (response.success) {
              this.successMessage = 'Director actualizado exitosamente';
              this.cerrarModales();
              this.directorActualizado.emit();
            } else {
              this.errorMessage = response.message || 'Error al actualizar director';
            }
            this.cdr.detectChanges();
          },
          error: (error) => {
            this.formLoading = false;
            this.errorHandler.handleHttpError(error, 'Actualizar Director');
            this.cdr.detectChanges();
            
            // Forzar detección de cambios adicional
            setTimeout(() => {
              this.cdr.detectChanges();
            }, 100);
          }
        });
    } else {
      this.markFormGroupTouched(this.editForm);
    }
  }

  /**
   * Verificar usuarios asignados al director
   */
  verificarUsuariosAsignados(idDirector: string): void {
    this.verificandoUsuarios = true;
    this.directorUsuarios = [];

    this.directorService.verificarUsuariosAsignados(idDirector)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.verificandoUsuarios = false;
          if (response.success && response.data) {
            this.directorUsuarios = response.data.usuarios || [];
          }
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.verificandoUsuarios = false;
          this.directorUsuarios = [];
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Verificar si el director tiene usuarios asignados
   */
  tieneUsuariosAsignados(): boolean {
    return this.directorUsuarios.length > 0;
  }

  /**
   * Eliminar director (el backend maneja la eliminación en cascada del usuario)
   */
  eliminarDirector(): void {
    if (this.selectedDirector) {
      this.formLoading = true;
      this.errorMessage = '';

      this.directorService.eliminarDirector(this.selectedDirector.id_director)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.formLoading = false;
            if (response.success) {
              this.successMessage = 'Director eliminado exitosamente';
              this.cerrarModales();
              this.directorEliminado.emit();
            } else {
              this.errorMessage = response.message || 'Error al eliminar director';
            }
            this.cdr.detectChanges();
          },
          error: (error) => {
            this.formLoading = false;
            this.errorHandler.handleHttpError(error, 'Eliminar Director');
            this.cdr.detectChanges();
            
            // Forzar detección de cambios adicional
            setTimeout(() => {
              this.cdr.detectChanges();
            }, 100);
          }
        });
    }
  }

  /**
   * Marcar todos los campos como tocados
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Obtener mensaje de error para un campo
   */
  getFieldError(form: FormGroup, fieldName: string): string {
    const field = form.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} es requerido`;
      }
      if (field.errors['email']) {
        return 'Email inválido';
      }
      if (field.errors['minlength']) {
        return `${this.getFieldLabel(fieldName)} debe tener al menos ${field.errors['minlength'].requiredLength} caracteres`;
      }
      if (field.errors['maxlength']) {
        return `${this.getFieldLabel(fieldName)} no puede tener más de ${field.errors['maxlength'].requiredLength} caracteres`;
      }
    }
    return '';
  }

  /**
   * Obtener etiqueta del campo
   */
  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      'nombres': 'Nombres',
      'apellidos': 'Apellidos',
      'email': 'Email',
      'telefono': 'Teléfono',
      'direccion': 'Dirección'
    };
    return labels[fieldName] || fieldName;
  }

  /**
   * Verificar si un campo tiene error
   */
  hasFieldError(form: FormGroup, fieldName: string): boolean {
    const field = form.get(fieldName);
    return !!(field?.errors && field.touched);
  }

  /**
   * Obtener clase CSS para campo con error
   */
  getFieldClass(form: FormGroup, fieldName: string): string {
    return this.hasFieldError(form, fieldName) 
      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500';
  }

  /**
   * Limpiar mensajes
   */
  clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  // ==================== MÉTODOS DE ASIGNACIÓN DE USUARIOS ====================

  /**
   * Mostrar modal de asignación de usuario
   */
  mostrarAsignarModal(director: Director): void {
    this.selectedDirector = director;
    this.showAssignModal = true;
    this.showCreateForm = false;
    this.showEditForm = false;
    this.showDeleteModal = false;
    this.clearMessages();
    this.cargarUsuariosDisponibles();
    
    // Marcar automáticamente el usuario actualmente asignado
    setTimeout(() => {
      if (director.usuario?.id_user) {
        this.assignForm.patchValue({
          id_user: director.usuario.id_user
        });
      } else {
        // Si no tiene usuario asignado, marcar "Sin Usuario"
        this.assignForm.patchValue({
          id_user: 'sin_usuario'
        });
      }
      this.cdr.detectChanges();
    }, 100);
  }

  /**
   * Cerrar modal de asignación
   */
  cerrarAsignarModal(): void {
    this.showAssignModal = false;
    this.selectedDirector = null;
    this.assignForm.reset();
    this.usuariosDisponibles = [];
    this.clearMessages();
  }

  /**
   * Cargar usuarios disponibles con rol DIRECTOR
   */
  cargarUsuariosDisponibles(): void {
    this.cargandoUsuarios = true;
    this.usuariosDisponibles = [];

    this.directorService.obtenerUsuariosDisponibles()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.cargandoUsuarios = false;
          if (response.success && response.data) {
            this.usuariosDisponibles = response.data;
          } else {
            this.usuariosDisponibles = [];
          }
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.cargandoUsuarios = false;
          this.usuariosDisponibles = [];
          this.errorHandler.handleHttpError(error, 'Cargar Usuarios Disponibles');
          this.cdr.detectChanges();
          
          // Forzar detección de cambios adicional
          setTimeout(() => {
            this.cdr.detectChanges();
          }, 100);
        }
      });
  }

  /**
   * Asignar usuario al director (primer usuario, cambiar usuario existente, o desasignar)
   */
  asignarUsuario(): void {
    if (this.assignForm.valid && this.selectedDirector) {
      this.formLoading = true;
      this.errorMessage = '';

      const selectedUserId = this.assignForm.value.id_user;
      
      // Si se selecciona "Sin Usuario", enviar null
      const datosCambio: CambiarUsuarioDto = {
        id_user: selectedUserId === 'sin_usuario' ? null : selectedUserId
      };

      this.directorService.cambiarUsuario(this.selectedDirector.id_director, datosCambio)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.formLoading = false;
            if (response.success) {
              if (selectedUserId === 'sin_usuario') {
                this.successMessage = 'Usuario desasignado exitosamente del director';
              } else {
                this.successMessage = 'Usuario asignado exitosamente al director';
              }
              this.cerrarAsignarModal();
              this.directorActualizado.emit();
            } else {
              this.errorMessage = response.message || 'Error al procesar asignación';
            }
            this.cdr.detectChanges();
          },
          error: (error) => {
            this.formLoading = false;
            this.errorHandler.handleHttpError(error, 'Procesar Asignación');
            this.cdr.detectChanges();
            
            // Forzar detección de cambios adicional
            setTimeout(() => {
              this.cdr.detectChanges();
            }, 100);
          }
        });
    }
  }

  /**
   * Cambiar usuario asignado al director
   */
  cambiarUsuario(): void {
    if (this.assignForm.valid && this.selectedDirector) {
      this.formLoading = true;
      this.errorMessage = '';

      const datosCambio: CambiarUsuarioDto = {
        id_user: this.assignForm.value.id_user
      };

      this.directorService.cambiarUsuario(this.selectedDirector.id_director, datosCambio)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.formLoading = false;
            if (response.success) {
              this.successMessage = 'Usuario cambiado exitosamente';
              this.cerrarAsignarModal();
              this.directorActualizado.emit();
            } else {
              this.errorMessage = response.message || 'Error al cambiar usuario';
            }
            this.cdr.detectChanges();
          },
          error: (error) => {
            this.formLoading = false;
            this.errorHandler.handleHttpError(error, 'Cambiar Usuario');
            this.cdr.detectChanges();
            
            // Forzar detección de cambios adicional
            setTimeout(() => {
              this.cdr.detectChanges();
            }, 100);
          }
        });
    }
  }

  /**
   * Desasignar usuario del director (eliminar director)
   */
  desasignarUsuario(): void {
    if (this.selectedDirector) {
      this.mostrarEliminarModal(this.selectedDirector);
    }
  }

  /**
   * Verificar si el director tiene usuario asignado
   */
  tieneUsuarioAsignado(director: Director): boolean {
    return !!(director.usuario && director.usuario.id_user);
  }

  /**
   * Obtener texto del botón de asignación
   */
  getAssignButtonText(director: Director): string {
    const selectedUserId = this.assignForm.get('id_user')?.value;
    
    if (selectedUserId === 'sin_usuario') {
      return 'Desasignar Usuario';
    } else if (this.tieneUsuarioAsignado(director)) {
      return 'Cambiar Usuario';
    } else {
      return 'Asignar Usuario';
    }
  }

  /**
   * Obtener clase del botón de asignación
   */
  getAssignButtonClass(director: Director): string {
    return this.tieneUsuarioAsignado(director) 
      ? 'inline-flex items-center px-3 py-1.5 border border-orange-300 rounded-md text-xs font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors duration-200'
      : 'inline-flex items-center px-3 py-1.5 border border-green-300 rounded-md text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200';
  }

  // ==================== MÉTODOS DE REINTENTO ====================

  /**
   * Reintentar operación de crear director
   */
  retryCrearDirector(): void {
    if (this.createForm.valid) {
      this.crearDirector();
    }
  }

  /**
   * Reintentar operación de actualizar director
   */
  retryActualizarDirector(): void {
    if (this.editForm.valid && this.selectedDirector) {
      this.actualizarDirector();
    }
  }

  /**
   * Reintentar operación de eliminar director
   */
  retryEliminarDirector(): void {
    if (this.selectedDirector) {
      this.eliminarDirector();
    }
  }

  /**
   * Reintentar operación de asignar usuario
   */
  retryAsignarUsuario(): void {
    if (this.assignForm.valid && this.selectedDirector) {
      if (this.tieneUsuarioAsignado(this.selectedDirector)) {
        this.cambiarUsuario();
      } else {
        this.asignarUsuario();
      }
    }
  }

  /**
   * Reintentar cargar usuarios disponibles
   */
  retryCargarUsuarios(): void {
    this.cargarUsuariosDisponibles();
  }
}
