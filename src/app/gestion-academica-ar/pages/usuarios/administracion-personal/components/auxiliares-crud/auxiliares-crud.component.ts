import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { AuxiliarService } from '../../../services/auxiliar.service';
import { Auxiliar, CreateAuxiliarDto, UpdateAuxiliarDto, UsuarioDisponible, AsignarUsuarioDto, CambiarUsuarioDto } from '../../../interfaces/auxiliar.interface';
import { ErrorHandlerService, ErrorType } from '../../../../../../shared/services/error-handler.service';
import { UserStoreService } from '../../../../../../auth/store/user.store';

@Component({
  selector: 'app-auxiliares-crud',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './auxiliares-crud.component.html',
  styleUrls: ['./auxiliares-crud.component.css']
})
export class AuxiliaresCrudComponent implements OnInit, OnDestroy, OnChanges {
  @Input() auxiliares: Auxiliar[] = [];
  @Input() loading = false;
  
  @Output() auxiliarCreado = new EventEmitter<void>();
  @Output() auxiliarActualizado = new EventEmitter<void>();
  @Output() auxiliarEliminado = new EventEmitter<void>();

  private auxiliarService = inject(AuxiliarService);
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
  selectedAuxiliar: Auxiliar | null = null;
  formLoading = false;
  
  // Validación de eliminación
  auxiliarUsuarios: any[] = [];
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
  auxiliaresFiltrados: Auxiliar[] = [];

  constructor() {
    this.createForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      apellido: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      correo_electronico: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
      telefono: ['', [Validators.maxLength(20)]],
      direccion: ['', [Validators.maxLength(255)]]
    });

    this.editForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      apellido: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      correo_electronico: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
      telefono: ['', [Validators.maxLength(20)]],
      direccion: ['', [Validators.maxLength(255)]]
    });

    this.assignForm = this.fb.group({
      id_user: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    // El componente ya recibe los auxiliares como input
    this.aplicarFiltros();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['auxiliares']) {
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
  mostrarEditarFormulario(auxiliar: Auxiliar): void {
    this.selectedAuxiliar = auxiliar;
    this.showEditForm = true;
    this.showCreateForm = false;
    this.showDeleteModal = false;
    
    this.editForm.patchValue({
      nombre: auxiliar.nombre,
      apellido: auxiliar.apellido,
      correo_electronico: auxiliar.correo_electronico,
      telefono: auxiliar.telefono || '',
      direccion: auxiliar.direccion || ''
    });
    
    this.clearMessages();
  }

  /**
   * Mostrar modal de eliminación
   */
  mostrarEliminarModal(auxiliar: Auxiliar): void {
    this.selectedAuxiliar = auxiliar;
    this.showDeleteModal = true;
    this.showCreateForm = false;
    this.showEditForm = false;
    this.clearMessages();
    
    // Verificar si el auxiliar tiene usuarios asignados
    this.verificarUsuariosAsignados(auxiliar.id_auxiliar);
  }

  /**
   * Cerrar todos los modales
   */
  cerrarModales(): void {
    this.showCreateForm = false;
    this.showEditForm = false;
    this.showDeleteModal = false;
    this.showAssignModal = false;
    this.selectedAuxiliar = null;
    this.auxiliarUsuarios = [];
    this.verificandoUsuarios = false;
    this.usuariosDisponibles = [];
    this.assignForm.reset();
    this.clearMessages();
  }

  /**
   * Crear auxiliar
   */
  crearAuxiliar(): void {
    if (this.createForm.valid) {
      this.formLoading = true;
      this.errorMessage = '';

      const auxiliarData: CreateAuxiliarDto = this.createForm.value;

      this.auxiliarService.crearAuxiliar(auxiliarData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.formLoading = false;
            if (response.success) {
              this.successMessage = 'Auxiliar creado exitosamente';
              this.cerrarModales();
              this.auxiliarCreado.emit();
            } else {
              this.errorMessage = response.message || 'Error al crear auxiliar';
            }
            this.cdr.detectChanges();
          },
          error: (error) => {
            this.formLoading = false;
            this.errorHandler.addError({
              type: ErrorType.SERVER,
              title: 'Error al Crear Auxiliar',
              message: error.error?.message || 'No se pudo crear el auxiliar',
              retryable: true,
              action: {
                label: 'Reintentar',
                action: () => this.retryCrearAuxiliar(),
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
   * Actualizar auxiliar
   */
  actualizarAuxiliar(): void {
    if (this.editForm.valid && this.selectedAuxiliar) {
      this.formLoading = true;
      this.errorMessage = '';

      const auxiliarData: UpdateAuxiliarDto = this.editForm.value;

      this.auxiliarService.actualizarAuxiliar(this.selectedAuxiliar.id_auxiliar, auxiliarData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.formLoading = false;
            if (response.success) {
              this.successMessage = 'Auxiliar actualizado exitosamente';
              this.cerrarModales();
              this.auxiliarActualizado.emit();
            } else {
              this.errorMessage = response.message || 'Error al actualizar auxiliar';
            }
            this.cdr.detectChanges();
          },
          error: (error) => {
            this.formLoading = false;
            this.errorHandler.handleHttpError(error, 'Actualizar Auxiliar');
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
   * Verificar usuarios asignados al auxiliar
   */
  verificarUsuariosAsignados(idAuxiliar: string): void {
    this.verificandoUsuarios = true;
    this.auxiliarUsuarios = [];

    this.auxiliarService.verificarUsuariosAsignados(idAuxiliar)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.verificandoUsuarios = false;
          if (response.success && response.data) {
            this.auxiliarUsuarios = response.data.usuarios || [];
          }
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.verificandoUsuarios = false;
          this.auxiliarUsuarios = [];
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Verificar si el auxiliar tiene usuarios asignados
   */
  tieneUsuariosAsignados(): boolean {
    return this.auxiliarUsuarios.length > 0;
  }

  /**
   * Eliminar auxiliar (el backend maneja la eliminación en cascada del usuario)
   */
  eliminarAuxiliar(): void {
    if (this.selectedAuxiliar) {
      this.formLoading = true;
      this.errorMessage = '';

      this.auxiliarService.eliminarAuxiliar(this.selectedAuxiliar.id_auxiliar)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.formLoading = false;
            if (response.success) {
              this.successMessage = 'Auxiliar eliminado exitosamente';
              this.cerrarModales();
              this.auxiliarEliminado.emit();
            } else {
              this.errorMessage = response.message || 'Error al eliminar auxiliar';
            }
            this.cdr.detectChanges();
          },
          error: (error) => {
            this.formLoading = false;
            this.errorHandler.handleHttpError(error, 'Eliminar Auxiliar');
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
      'nombre': 'Nombre',
      'apellido': 'Apellido',
      'correo_electronico': 'Correo Electrónico',
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
  mostrarAsignarModal(auxiliar: Auxiliar): void {
    this.selectedAuxiliar = auxiliar;
    this.showAssignModal = true;
    this.showCreateForm = false;
    this.showEditForm = false;
    this.showDeleteModal = false;
    this.clearMessages();
    this.cargarUsuariosDisponibles();
    
    // Marcar automáticamente el usuario actualmente asignado
    setTimeout(() => {
      if (auxiliar.usuario?.id_user) {
        this.assignForm.patchValue({
          id_user: auxiliar.usuario.id_user
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
    this.selectedAuxiliar = null;
    this.assignForm.reset();
    this.usuariosDisponibles = [];
    this.clearMessages();
  }

  /**
   * Cargar usuarios disponibles con rol AUXILIAR
   */
  cargarUsuariosDisponibles(): void {
    this.cargandoUsuarios = true;
    this.usuariosDisponibles = [];

    this.auxiliarService.obtenerUsuariosDisponibles()
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
   * Asignar usuario al auxiliar (primer usuario, cambiar usuario existente, o desasignar)
   */
  asignarUsuario(): void {
    if (this.assignForm.valid && this.selectedAuxiliar) {
      this.formLoading = true;
      this.errorMessage = '';

      const selectedUserId = this.assignForm.value.id_user;
      
      // Si se selecciona "Sin Usuario", enviar null
      const datosCambio: CambiarUsuarioDto = {
        id_user: selectedUserId === 'sin_usuario' ? null : selectedUserId
      };

      this.auxiliarService.cambiarUsuario(this.selectedAuxiliar.id_auxiliar, datosCambio)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.formLoading = false;
            if (response.success) {
              if (selectedUserId === 'sin_usuario') {
                this.successMessage = 'Usuario desasignado exitosamente del auxiliar';
              } else {
                this.successMessage = 'Usuario asignado exitosamente al auxiliar';
              }
              this.cerrarAsignarModal();
              this.auxiliarActualizado.emit();
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
   * Verificar si el auxiliar tiene usuario asignado
   */
  tieneUsuarioAsignado(auxiliar: Auxiliar): boolean {
    return !!(auxiliar.usuario && auxiliar.usuario.id_user);
  }

  /**
   * Obtener texto del botón de asignación
   */
  getAssignButtonText(auxiliar: Auxiliar): string {
    const selectedUserId = this.assignForm.get('id_user')?.value;
    
    if (selectedUserId === 'sin_usuario') {
      return 'Desasignar Usuario';
    } else if (this.tieneUsuarioAsignado(auxiliar)) {
      return 'Cambiar Usuario';
    } else {
      return 'Asignar Usuario';
    }
  }

  /**
   * Obtener clase del botón de asignación
   */
  getAssignButtonClass(auxiliar: Auxiliar): string {
    return this.tieneUsuarioAsignado(auxiliar) 
      ? 'inline-flex items-center px-3 py-1.5 border border-orange-300 rounded-md text-xs font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors duration-200'
      : 'inline-flex items-center px-3 py-1.5 border border-green-300 rounded-md text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200';
  }

  // ==================== MÉTODOS DE REINTENTO ====================

  /**
   * Reintentar operación de crear auxiliar
   */
  retryCrearAuxiliar(): void {
    if (this.createForm.valid) {
      this.crearAuxiliar();
    }
  }

  /**
   * Reintentar operación de actualizar auxiliar
   */
  retryActualizarAuxiliar(): void {
    if (this.editForm.valid && this.selectedAuxiliar) {
      this.actualizarAuxiliar();
    }
  }

  /**
   * Reintentar operación de eliminar auxiliar
   */
  retryEliminarAuxiliar(): void {
    if (this.selectedAuxiliar) {
      this.eliminarAuxiliar();
    }
  }

  /**
   * Reintentar operación de asignar usuario
   */
  retryAsignarUsuario(): void {
    if (this.assignForm.valid && this.selectedAuxiliar) {
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
   * Verificar si un auxiliar es el usuario autenticado
   */
  private esUsuarioAutenticado(auxiliar: Auxiliar): boolean {
    const user = this.userStore.user();
    if (!user || user.role !== 'AUXILIAR' || !user.auxiliar) {
      return false;
    }
    return auxiliar.id_auxiliar === user.auxiliar.id_auxiliar;
  }

  /**
   * Aplicar filtros a la lista de auxiliares
   */
  aplicarFiltros(): void {
    // Filtrar el usuario autenticado primero
    const auxiliaresSinUsuarioAutenticado = this.auxiliares.filter(auxiliar => 
      !this.esUsuarioAutenticado(auxiliar)
    );

    if (!this.filtroTexto.trim()) {
      this.auxiliaresFiltrados = [...auxiliaresSinUsuarioAutenticado];
    } else {
      const textoFiltro = this.filtroTexto.toLowerCase().trim();
      this.auxiliaresFiltrados = auxiliaresSinUsuarioAutenticado.filter(auxiliar => 
        auxiliar.nombre.toLowerCase().includes(textoFiltro) ||
        auxiliar.apellido.toLowerCase().includes(textoFiltro) ||
        auxiliar.correo_electronico.toLowerCase().includes(textoFiltro) ||
        (auxiliar.telefono && auxiliar.telefono.includes(textoFiltro)) ||
        (auxiliar.direccion && auxiliar.direccion.toLowerCase().includes(textoFiltro)) ||
        (auxiliar.usuario && auxiliar.usuario.nombre_usuario.toLowerCase().includes(textoFiltro))
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
   * Obtener el número de auxiliares filtrados
   */
  get numeroAuxiliaresFiltrados(): number {
    return this.auxiliaresFiltrados.length;
  }

  /**
   * Verificar si hay filtros activos
   */
  get tieneFiltrosActivos(): boolean {
    return this.filtroTexto.trim().length > 0;
  }
}
