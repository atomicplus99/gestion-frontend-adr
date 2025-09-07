import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { AdministradorService } from '../../../services/administrador.service';
import { Administrador, CreateAdministradorDto, UpdateAdministradorDto, UsuarioDisponible, AsignarUsuarioDto, CambiarUsuarioDto } from '../../../interfaces/administrador.interface';
import { ErrorHandlerService, ErrorType } from '../../../../../../shared/services/error-handler.service';
import { UserStoreService } from '../../../../../../auth/store/user.store';

@Component({
  selector: 'app-administradores-crud',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './administradores-crud.component.html',
  styleUrls: ['./administradores-crud.component.css']
})
export class AdministradoresCrudComponent implements OnInit, OnDestroy, OnChanges {
  @Input() administradores: Administrador[] = [];
  @Input() loading = false;
  
  @Output() administradorCreado = new EventEmitter<void>();
  @Output() administradorActualizado = new EventEmitter<void>();
  @Output() administradorEliminado = new EventEmitter<void>();

  private administradorService = inject(AdministradorService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private errorHandler = inject(ErrorHandlerService);
  private userStore = inject(UserStoreService);
  private destroy$ = new Subject<void>();

  // Estado
  showCreateForm = false;
  showEditForm = false;
  showDeleteModal = false;
  showAssignModal = false;
  selectedAdministrador: Administrador | null = null;
  formLoading = false;
  
  // Validación de eliminación
  administradorUsuarios: any[] = [];
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

  // Filtros
  filtroTexto = '';
  administradoresFiltrados: Administrador[] = [];

  constructor() {
    this.createForm = this.fb.group({
      nombres: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      apellidos: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
      telefono: ['', [Validators.maxLength(20)]],
      direccion: ['', [Validators.maxLength(255)]]
    });

    this.editForm = this.fb.group({
      nombres: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      apellidos: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
      telefono: ['', [Validators.maxLength(20)]],
      direccion: ['', [Validators.maxLength(255)]]
    });

    this.assignForm = this.fb.group({
      id_user: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    // El componente ya recibe los administradores como input
    this.aplicarFiltros();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['administradores']) {
      this.aplicarFiltros();
    }
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
  mostrarEditarFormulario(administrador: Administrador): void {
    this.selectedAdministrador = administrador;
    this.showEditForm = true;
    this.showCreateForm = false;
    this.showDeleteModal = false;
    
    this.editForm.patchValue({
      nombres: administrador.nombres,
      apellidos: administrador.apellidos,
      email: administrador.email,
      telefono: administrador.telefono || '',
      direccion: administrador.direccion || ''
    });
    
    this.clearMessages();
  }

  /**
   * Mostrar modal de eliminación
   */
  mostrarEliminarModal(administrador: Administrador): void {
    this.selectedAdministrador = administrador;
    this.showDeleteModal = true;
    this.showCreateForm = false;
    this.showEditForm = false;
    this.clearMessages();
    
    // Verificar si el administrador tiene usuarios asignados
    this.verificarUsuariosAsignados(administrador.id_administrador);
  }

  /**
   * Cerrar todos los modales
   */
  cerrarModales(): void {
    this.showCreateForm = false;
    this.showEditForm = false;
    this.showDeleteModal = false;
    this.showAssignModal = false;
    this.selectedAdministrador = null;
    this.administradorUsuarios = [];
    this.verificandoUsuarios = false;
    this.usuariosDisponibles = [];
    this.assignForm.reset();
    this.clearMessages();
  }

  /**
   * Crear administrador
   */
  crearAdministrador(): void {
    if (this.createForm.valid) {
      this.formLoading = true;
      this.errorMessage = '';

      const administradorData: CreateAdministradorDto = this.createForm.value;

      this.administradorService.crearAdministrador(administradorData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.formLoading = false;
            if (response.success) {
              this.successMessage = 'Administrador creado exitosamente';
              this.cerrarModales();
              this.administradorCreado.emit();
            } else {
              this.errorMessage = response.message || 'Error al crear administrador';
            }
            this.cdr.detectChanges();
          },
          error: (error) => {
            this.formLoading = false;
            this.errorHandler.addError({
              type: ErrorType.SERVER,
              title: 'Error al Crear Administrador',
              message: error.error?.message || 'No se pudo crear el administrador',
              retryable: true,
              action: {
                label: 'Reintentar',
                action: () => this.retryCrearAdministrador(),
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
   * Actualizar administrador
   */
  actualizarAdministrador(): void {
    if (this.editForm.valid && this.selectedAdministrador) {
      this.formLoading = true;
      this.errorMessage = '';

      const administradorData: UpdateAdministradorDto = this.editForm.value;

      this.administradorService.actualizarAdministrador(this.selectedAdministrador.id_administrador, administradorData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.formLoading = false;
            if (response.success) {
              this.successMessage = 'Administrador actualizado exitosamente';
              this.cerrarModales();
              this.administradorActualizado.emit();
            } else {
              this.errorMessage = response.message || 'Error al actualizar administrador';
            }
            this.cdr.detectChanges();
          },
          error: (error) => {
            this.formLoading = false;
            this.errorHandler.handleHttpError(error, 'Actualizar Administrador');
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
   * Verificar usuarios asignados al administrador
   */
  verificarUsuariosAsignados(idAdministrador: string): void {
    this.verificandoUsuarios = true;
    this.administradorUsuarios = [];

    this.administradorService.verificarUsuariosAsignados(idAdministrador)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.verificandoUsuarios = false;
          if (response.success && response.data) {
            this.administradorUsuarios = response.data.usuarios || [];
          }
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.verificandoUsuarios = false;
          this.administradorUsuarios = [];
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Verificar si el administrador tiene usuarios asignados
   */
  tieneUsuariosAsignados(): boolean {
    return this.administradorUsuarios.length > 0;
  }

  /**
   * Eliminar administrador (el backend maneja la eliminación en cascada del usuario)
   */
  eliminarAdministrador(): void {
    if (this.selectedAdministrador) {
      this.formLoading = true;
      this.errorMessage = '';

      this.administradorService.eliminarAdministrador(this.selectedAdministrador.id_administrador)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.formLoading = false;
            if (response.success) {
              this.successMessage = 'Administrador eliminado exitosamente';
              this.cerrarModales();
              this.administradorEliminado.emit();
            } else {
              this.errorMessage = response.message || 'Error al eliminar administrador';
            }
            this.cdr.detectChanges();
          },
          error: (error) => {
            this.formLoading = false;
            this.errorHandler.handleHttpError(error, 'Eliminar Administrador');
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
  mostrarAsignarModal(administrador: Administrador): void {
    this.selectedAdministrador = administrador;
    this.showAssignModal = true;
    this.showCreateForm = false;
    this.showEditForm = false;
    this.showDeleteModal = false;
    this.clearMessages();
    this.cargarUsuariosDisponibles();
    
    // Marcar automáticamente el usuario actualmente asignado
    setTimeout(() => {
      if (administrador.usuario?.id_user) {
        this.assignForm.patchValue({
          id_user: administrador.usuario.id_user
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
    this.selectedAdministrador = null;
    this.assignForm.reset();
    this.usuariosDisponibles = [];
    this.clearMessages();
  }

  /**
   * Cargar usuarios disponibles con rol ADMINISTRADOR
   */
  cargarUsuariosDisponibles(): void {
    this.cargandoUsuarios = true;
    this.usuariosDisponibles = [];

    this.administradorService.obtenerUsuariosDisponibles()
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
   * Asignar usuario al administrador (primer usuario, cambiar usuario existente, o desasignar)
   */
  asignarUsuario(): void {
    if (this.assignForm.valid && this.selectedAdministrador) {
      this.formLoading = true;
      this.errorMessage = '';

      const selectedUserId = this.assignForm.value.id_user;
      
      // Si se selecciona "Sin Usuario", enviar null
      const datosCambio: CambiarUsuarioDto = {
        id_user: selectedUserId === 'sin_usuario' ? null : selectedUserId
      };

      this.administradorService.cambiarUsuario(this.selectedAdministrador.id_administrador, datosCambio)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.formLoading = false;
            if (response.success) {
              if (selectedUserId === 'sin_usuario') {
                this.successMessage = 'Usuario desasignado exitosamente del administrador';
              } else {
                this.successMessage = 'Usuario asignado exitosamente al administrador';
              }
              this.cerrarAsignarModal();
              this.administradorActualizado.emit();
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
   * Verificar si el administrador tiene usuario asignado
   */
  tieneUsuarioAsignado(administrador: Administrador): boolean {
    return !!(administrador.usuario && administrador.usuario.id_user);
  }

  /**
   * Obtener texto del botón de asignación
   */
  getAssignButtonText(administrador: Administrador): string {
    const selectedUserId = this.assignForm.get('id_user')?.value;
    
    if (selectedUserId === 'sin_usuario') {
      return 'Desasignar Usuario';
    } else if (this.tieneUsuarioAsignado(administrador)) {
      return 'Cambiar Usuario';
    } else {
      return 'Asignar Usuario';
    }
  }

  /**
   * Obtener clase del botón de asignación
   */
  getAssignButtonClass(administrador: Administrador): string {
    return this.tieneUsuarioAsignado(administrador) 
      ? 'inline-flex items-center px-3 py-1.5 border border-orange-300 rounded-md text-xs font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors duration-200'
      : 'inline-flex items-center px-3 py-1.5 border border-green-300 rounded-md text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200';
  }

  // ==================== MÉTODOS DE REINTENTO ====================

  /**
   * Reintentar operación de crear administrador
   */
  retryCrearAdministrador(): void {
    if (this.createForm.valid) {
      this.crearAdministrador();
    }
  }

  /**
   * Reintentar operación de actualizar administrador
   */
  retryActualizarAdministrador(): void {
    if (this.editForm.valid && this.selectedAdministrador) {
      this.actualizarAdministrador();
    }
  }

  /**
   * Reintentar operación de eliminar administrador
   */
  retryEliminarAdministrador(): void {
    if (this.selectedAdministrador) {
      this.eliminarAdministrador();
    }
  }

  /**
   * Reintentar operación de asignar usuario
   */
  retryAsignarUsuario(): void {
    if (this.assignForm.valid && this.selectedAdministrador) {
      this.asignarUsuario();
    }
  }

  /**
   * Reintentar cargar usuarios disponibles
   */
  retryCargarUsuarios(): void {
    this.cargarUsuariosDisponibles();
  }

  // ==================== MÉTODOS DE FILTRADO ====================

  /**
   * Verificar si un administrador es el usuario autenticado
   */
  private esUsuarioAutenticado(administrador: Administrador): boolean {
    const user = this.userStore.user();
    if (!user || (user.role !== 'ADMINISTRADOR' && user.role !== 'ADMIN') || !user.administrador) {
      return false;
    }
    return administrador.id_administrador === user.administrador.id_administrador;
  }

  /**
   * Aplicar filtros a la lista de administradores
   */
  aplicarFiltros(): void {
    // Filtrar el usuario autenticado primero
    const administradoresSinUsuarioAutenticado = this.administradores.filter(administrador => 
      !this.esUsuarioAutenticado(administrador)
    );

    if (!this.filtroTexto.trim()) {
      this.administradoresFiltrados = [...administradoresSinUsuarioAutenticado];
    } else {
      const textoFiltro = this.filtroTexto.toLowerCase().trim();
      this.administradoresFiltrados = administradoresSinUsuarioAutenticado.filter(administrador => 
        administrador.nombres.toLowerCase().includes(textoFiltro) ||
        administrador.apellidos.toLowerCase().includes(textoFiltro) ||
        administrador.email.toLowerCase().includes(textoFiltro) ||
        (administrador.telefono && administrador.telefono.includes(textoFiltro)) ||
        (administrador.direccion && administrador.direccion.toLowerCase().includes(textoFiltro)) ||
        (administrador.usuario && administrador.usuario.nombre_usuario.toLowerCase().includes(textoFiltro))
      );
    }
  }

  /**
   * Limpiar filtros
   */
  limpiarFiltros(): void {
    this.filtroTexto = '';
    this.aplicarFiltros();
  }

  /**
   * Obtener el número de administradores filtrados
   */
  get numeroAdministradoresFiltrados(): number {
    return this.administradoresFiltrados.length;
  }

  /**
   * Verificar si hay filtros activos
   */
  get tieneFiltrosActivos(): boolean {
    return this.filtroTexto.trim().length > 0;
  }
}
