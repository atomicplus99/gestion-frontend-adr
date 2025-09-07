import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { AlumnoService } from '../../../services/alumno.service';
import { Alumno, CreateAlumnoDto, UpdateAlumnoDto, UsuarioDisponible, AsignarUsuarioDto, CambiarUsuarioDto, Turno } from '../../../interfaces/alumno.interface';
import { ErrorHandlerService, ErrorType } from '../../../../../../shared/services/error-handler.service';
import { UserStoreService } from '../../../../../../auth/store/user.store';

@Component({
  selector: 'app-alumnos-crud',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './alumnos-crud.component.html',
  styleUrls: ['./alumnos-crud.component.css']
})
export class AlumnosCrudComponent implements OnInit, OnDestroy, OnChanges {
  @Input() alumnos: Alumno[] = [];
  @Input() loading = false;
  @Input() turnos: Turno[] = [];
  
  @Output() alumnoCreado = new EventEmitter<void>();
  @Output() alumnoActualizado = new EventEmitter<void>();
  @Output() alumnoEliminado = new EventEmitter<void>();

  private alumnoService = inject(AlumnoService);
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
  selectedAlumno: Alumno | null = null;
  formLoading = false;
  
  // Validación de eliminación
  alumnoUsuarios: any[] = [];
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
  alumnosFiltrados: Alumno[] = [];

  // Niveles educativos
  nivelesEducativos = [
    { value: 'Inicial', label: 'Inicial' },
    { value: 'Primaria', label: 'Primaria' },
    { value: 'Secundaria', label: 'Secundaria' }
  ];

  // Grados por nivel
  gradosPorNivel: { [key: string]: number[] } = {
    'Inicial': [3, 4, 5],
    'Primaria': [1, 2, 3, 4, 5, 6],
    'Secundaria': [1, 2, 3, 4, 5]
  };

  constructor() {
    this.createForm = this.fb.group({
      codigo: ['', [Validators.required, Validators.pattern(/^\d{14}$/)]],
      dni_alumno: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      apellido: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      fecha_nacimiento: ['', [Validators.required]],
      direccion: ['', [Validators.required, Validators.maxLength(255)]],
      nivel: ['', [Validators.required]],
      grado: ['', [Validators.required]],
      seccion: ['', [Validators.required, Validators.maxLength(10)]],
      turno_id: ['', [Validators.required]]
    });

    this.editForm = this.fb.group({
      codigo: ['', [Validators.required, Validators.pattern(/^\d{14}$/)]],
      dni_alumno: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      apellido: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      fecha_nacimiento: ['', [Validators.required]],
      direccion: ['', [Validators.required, Validators.maxLength(255)]],
      nivel: ['', [Validators.required]],
      grado: ['', [Validators.required]],
      seccion: ['', [Validators.required, Validators.maxLength(10)]],
      turno_id: ['', [Validators.required]]
    });

    this.assignForm = this.fb.group({
      id_user: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    // El componente ya recibe los alumnos como input
    this.aplicarFiltros();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['alumnos']) {
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
  mostrarEditarFormulario(alumno: Alumno): void {
    this.selectedAlumno = alumno;
    this.showEditForm = true;
    this.showCreateForm = false;
    this.showDeleteModal = false;
    
    this.editForm.patchValue({
      codigo: alumno.codigo,
      dni_alumno: alumno.dni_alumno,
      nombre: alumno.nombre,
      apellido: alumno.apellido,
      fecha_nacimiento: this.formatDateForInput(alumno.fecha_nacimiento),
      direccion: alumno.direccion,
      nivel: alumno.nivel,
      grado: alumno.grado,
      seccion: alumno.seccion,
      turno_id: alumno.turno?.id_turno || ''
    });
    
    this.clearMessages();
  }

  /**
   * Mostrar modal de eliminación
   */
  mostrarEliminarModal(alumno: Alumno): void {
    this.selectedAlumno = alumno;
    this.showDeleteModal = true;
    this.showCreateForm = false;
    this.showEditForm = false;
    this.clearMessages();
    
    // Verificar si el alumno tiene usuarios asignados
    this.verificarUsuariosAsignados(alumno.id_alumno);
  }

  /**
   * Cerrar todos los modales
   */
  cerrarModales(): void {
    this.showCreateForm = false;
    this.showEditForm = false;
    this.showDeleteModal = false;
    this.showAssignModal = false;
    this.selectedAlumno = null;
    this.alumnoUsuarios = [];
    this.verificandoUsuarios = false;
    this.usuariosDisponibles = [];
    this.assignForm.reset();
    this.clearMessages();
  }

  /**
   * Crear alumno
   */
  crearAlumno(): void {
    if (this.createForm.valid) {
      this.formLoading = true;
      this.errorMessage = '';

      const alumnoData: CreateAlumnoDto = {
        ...this.createForm.value,
        fecha_nacimiento: new Date(this.createForm.value.fecha_nacimiento)
      };

      this.alumnoService.crearAlumno(alumnoData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.formLoading = false;
            if (response.success) {
              this.successMessage = 'Alumno creado exitosamente';
              this.cerrarModales();
              this.alumnoCreado.emit();
            } else {
              this.errorMessage = response.message || 'Error al crear alumno';
            }
            this.cdr.detectChanges();
          },
          error: (error) => {
            this.formLoading = false;
            this.errorHandler.addError({
              type: ErrorType.SERVER,
              title: 'Error al Crear Alumno',
              message: error.error?.message || 'No se pudo crear el alumno',
              retryable: true,
              action: {
                label: 'Reintentar',
                action: () => this.retryCrearAlumno(),
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
   * Actualizar alumno
   */
  actualizarAlumno(): void {
    if (this.editForm.valid && this.selectedAlumno) {
      this.formLoading = true;
      this.errorMessage = '';

      const alumnoData: UpdateAlumnoDto = {
        ...this.editForm.value,
        fecha_nacimiento: new Date(this.editForm.value.fecha_nacimiento)
      };

      this.alumnoService.actualizarAlumnoPorCodigo(this.selectedAlumno.codigo, alumnoData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.formLoading = false;
            if (response.success) {
              this.successMessage = 'Alumno actualizado exitosamente';
              this.cerrarModales();
              this.alumnoActualizado.emit();
            } else {
              this.errorMessage = response.message || 'Error al actualizar alumno';
            }
            this.cdr.detectChanges();
          },
          error: (error) => {
            this.formLoading = false;
            this.errorHandler.handleHttpError(error, 'Actualizar Alumno');
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
   * Verificar usuarios asignados al alumno
   */
  verificarUsuariosAsignados(idAlumno: string): void {
    this.verificandoUsuarios = true;
    this.alumnoUsuarios = [];

    this.alumnoService.verificarUsuariosAsignados(idAlumno)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.verificandoUsuarios = false;
          if (response.success && response.data) {
            this.alumnoUsuarios = response.data.usuarios || [];
          }
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.verificandoUsuarios = false;
          this.alumnoUsuarios = [];
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Verificar si el alumno tiene usuarios asignados
   */
  tieneUsuariosAsignados(): boolean {
    return this.alumnoUsuarios.length > 0;
  }

  /**
   * Eliminar alumno (el backend maneja la eliminación en cascada del usuario)
   */
  eliminarAlumno(): void {
    if (this.selectedAlumno) {
      this.formLoading = true;
      this.errorMessage = '';

      this.alumnoService.eliminarAlumno(this.selectedAlumno.id_alumno)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.formLoading = false;
            if (response.success) {
              this.successMessage = 'Alumno eliminado exitosamente';
              this.cerrarModales();
              this.alumnoEliminado.emit();
            } else {
              this.errorMessage = response.message || 'Error al eliminar alumno';
            }
            this.cdr.detectChanges();
          },
          error: (error) => {
            this.formLoading = false;
            this.errorHandler.handleHttpError(error, 'Eliminar Alumno');
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
   * Formatear fecha para input
   */
  private formatDateForInput(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toISOString().split('T')[0];
  }

  /**
   * Obtener grados disponibles para el nivel seleccionado
   */
  getGradosDisponibles(nivel: string): number[] {
    return this.gradosPorNivel[nivel] || [];
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
      if (field.errors['pattern']) {
        if (fieldName === 'codigo') {
          return 'El código debe tener exactamente 14 dígitos';
        }
        if (fieldName === 'dni_alumno') {
          return 'El DNI debe tener exactamente 8 dígitos';
        }
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
      'codigo': 'Código',
      'dni_alumno': 'DNI',
      'nombre': 'Nombre',
      'apellido': 'Apellido',
      'fecha_nacimiento': 'Fecha de Nacimiento',
      'direccion': 'Dirección',
      'nivel': 'Nivel',
      'grado': 'Grado',
      'seccion': 'Sección',
      'turno_id': 'Turno'
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
  mostrarAsignarModal(alumno: Alumno): void {
    this.selectedAlumno = alumno;
    this.showAssignModal = true;
    this.showCreateForm = false;
    this.showEditForm = false;
    this.showDeleteModal = false;
    this.clearMessages();
    this.cargarUsuariosDisponibles();
    
    // Marcar automáticamente el usuario actualmente asignado
    setTimeout(() => {
      if (alumno.usuario?.id_user) {
        this.assignForm.patchValue({
          id_user: alumno.usuario.id_user
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
    this.selectedAlumno = null;
    this.assignForm.reset();
    this.usuariosDisponibles = [];
    this.clearMessages();
  }

  /**
   * Cargar usuarios disponibles con rol ALUMNO
   */
  cargarUsuariosDisponibles(): void {
    this.cargandoUsuarios = true;
    this.usuariosDisponibles = [];

    this.alumnoService.obtenerUsuariosDisponibles()
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
   * Asignar usuario al alumno (primer usuario, cambiar usuario existente, o desasignar)
   */
  asignarUsuario(): void {
    if (this.assignForm.valid && this.selectedAlumno) {
      this.formLoading = true;
      this.errorMessage = '';

      const selectedUserId = this.assignForm.value.id_user;
      
      // Si se selecciona "Sin Usuario", enviar null
      const datosCambio: CambiarUsuarioDto = {
        id_user: selectedUserId === 'sin_usuario' ? null : selectedUserId
      };

      this.alumnoService.cambiarUsuario(this.selectedAlumno.id_alumno, datosCambio)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.formLoading = false;
            if (response.success) {
              if (selectedUserId === 'sin_usuario') {
                this.successMessage = 'Usuario desasignado exitosamente del alumno';
              } else {
                this.successMessage = 'Usuario asignado exitosamente al alumno';
              }
              this.cerrarAsignarModal();
              this.alumnoActualizado.emit();
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
   * Verificar si el alumno tiene usuario asignado
   */
  tieneUsuarioAsignado(alumno: Alumno): boolean {
    return !!(alumno.usuario && alumno.usuario.id_user);
  }

  /**
   * Obtener texto del botón de asignación
   */
  getAssignButtonText(alumno: Alumno): string {
    const selectedUserId = this.assignForm.get('id_user')?.value;
    
    if (selectedUserId === 'sin_usuario') {
      return 'Desasignar Usuario';
    } else if (this.tieneUsuarioAsignado(alumno)) {
      return 'Cambiar Usuario';
    } else {
      return 'Asignar Usuario';
    }
  }

  /**
   * Obtener clase del botón de asignación
   */
  getAssignButtonClass(alumno: Alumno): string {
    return this.tieneUsuarioAsignado(alumno) 
      ? 'inline-flex items-center px-3 py-1.5 border border-orange-300 rounded-md text-xs font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors duration-200'
      : 'inline-flex items-center px-3 py-1.5 border border-green-300 rounded-md text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200';
  }

  // ==================== MÉTODOS DE REINTENTO ====================

  /**
   * Reintentar operación de crear alumno
   */
  retryCrearAlumno(): void {
    if (this.createForm.valid) {
      this.crearAlumno();
    }
  }

  /**
   * Reintentar operación de actualizar alumno
   */
  retryActualizarAlumno(): void {
    if (this.editForm.valid && this.selectedAlumno) {
      this.actualizarAlumno();
    }
  }

  /**
   * Reintentar operación de eliminar alumno
   */
  retryEliminarAlumno(): void {
    if (this.selectedAlumno) {
      this.eliminarAlumno();
    }
  }

  /**
   * Reintentar operación de asignar usuario
   */
  retryAsignarUsuario(): void {
    if (this.assignForm.valid && this.selectedAlumno) {
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
   * Verificar si un alumno es el usuario autenticado
   */
  private esUsuarioAutenticado(alumno: Alumno): boolean {
    const user = this.userStore.user();
    if (!user || user.role !== 'ALUMNO' || !user.alumno) {
      return false;
    }
    return alumno.id_alumno === user.alumno.id_alumno;
  }

  /**
   * Aplicar filtros a la lista de alumnos
   */
  aplicarFiltros(): void {
    // Filtrar el usuario autenticado primero
    const alumnosSinUsuarioAutenticado = this.alumnos.filter(alumno => 
      !this.esUsuarioAutenticado(alumno)
    );

    if (!this.filtroTexto.trim()) {
      this.alumnosFiltrados = [...alumnosSinUsuarioAutenticado];
    } else {
      const textoFiltro = this.filtroTexto.toLowerCase().trim();
      this.alumnosFiltrados = alumnosSinUsuarioAutenticado.filter(alumno => 
        alumno.nombre.toLowerCase().includes(textoFiltro) ||
        alumno.apellido.toLowerCase().includes(textoFiltro) ||
        alumno.codigo.toLowerCase().includes(textoFiltro) ||
        alumno.dni_alumno.includes(textoFiltro) ||
        alumno.nivel.toLowerCase().includes(textoFiltro) ||
        alumno.grado.toString().includes(textoFiltro) ||
        alumno.seccion.toLowerCase().includes(textoFiltro) ||
        (alumno.turno && alumno.turno.turno.toLowerCase().includes(textoFiltro)) ||
        (alumno.usuario && alumno.usuario.nombre_usuario.toLowerCase().includes(textoFiltro))
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
   * Obtener el número de alumnos filtrados
   */
  get numeroAlumnosFiltrados(): number {
    return this.alumnosFiltrados.length;
  }

  /**
   * Verificar si hay filtros activos
   */
  get tieneFiltrosActivos(): boolean {
    return this.filtroTexto.trim().length > 0;
  }
}
