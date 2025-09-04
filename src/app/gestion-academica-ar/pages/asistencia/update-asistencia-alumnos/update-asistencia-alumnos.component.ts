// src/app/components/actualizar-asistencia/actualizar-asistencia.component.ts

import { ChangeDetectorRef, Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AsistenciaService, EstadoAsistencia, UpdateAsistenciaRequest, VerificarAsistenciaResponse } from './service/UpdateAsistencia.service';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { UserStoreService } from '../../../../auth/store/user.store';
import { ConfirmationMessageComponent, ConfirmationMessage } from '../../../../shared/components/confirmation-message/confirmation-message.component';

// Importar el UserStoreService
// Ajusta la ruta según tu estructura

@Component({
  imports: [ReactiveFormsModule, FormsModule, HttpClientModule, CommonModule, ConfirmationMessageComponent],
  selector: 'app-actualizar-asistencia',
  templateUrl: './update-asistencia-alumnos.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush // Optimización de rendimiento
})
export class ActualizarAsistenciaComponent implements OnInit, OnDestroy {

  // Formularios
  buscarForm!: FormGroup;
  actualizarForm!: FormGroup;

  // Estados del componente
  isLoading = false;
  isLoadingUpdate = false;
  showUpdateForm = false;

  // Estados para fecha específica
  fechaSeleccionada: string = '';
  usarFechaPersonalizada = false;

  // Datos del alumno y asistencia
  alumnoData: VerificarAsistenciaResponse | null = null;

  // Opciones para select
  estadosAsistencia = [
    { value: EstadoAsistencia.PUNTUAL, label: 'Puntual' },
    { value: EstadoAsistencia.TARDANZA, label: 'Tardanza' },
    { value: EstadoAsistencia.AUSENTE, label: 'Ausente' },
    { value: EstadoAsistencia.ANULADO, label: 'Anulado' },
    { value: EstadoAsistencia.JUSTIFICADO, label: 'Justificado' }
  ];

  // Subject para manejo de suscripciones
  private destroy$ = new Subject<void>();

  // Mensaje de confirmación personalizado
  confirmationMessage: ConfirmationMessage = {
    type: 'info',
    title: '',
    message: '',
    show: false
  };

  constructor(
    private fb: FormBuilder,
    private asistenciaService: AsistenciaService,
    private userStore: UserStoreService, // 🔥 Inyectar UserStoreService
    private cdr: ChangeDetectorRef
  ) {
    this.initializeForms();
    this.inicializarFecha();
  }

  ngOnInit(): void {
    // Verificar permisos de auxiliar al inicializar
    this.verificarPermisosAuxiliar();
    
    // Suscribirse a cambios del usuario
    this.setupUserSubscription();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========================================
  // MÉTODOS DE INICIALIZACIÓN Y PERMISOS
  // ========================================
  private verificarPermisosAuxiliar(): void {
    if (!this.puedeActualizarAsistencias) {
      this.confirmationMessage = {
        type: 'error',
        title: 'Sin Permisos',
        message: 'No tienes permisos de auxiliar para actualizar asistencias.',
        show: true
      };
    }
  }

  private setupUserSubscription(): void {
    // Observar cambios en el usuario para mantener actualizado el ID del auxiliar
    // Nota: Si userStore.user() es un signal, no necesitas suscripción
    // Si es un observable, descomenta la línea siguiente:
    
    // this.userStore.user()
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe(user => {
    //     this.forzarDeteccionCambios();
    //   });
  }

  // ========================================
  // GETTERS PARA USUARIO (AUXILIAR/ADMIN/DIRECTOR)
  // ========================================
  get nombreUsuarioActual(): string {
    const user = this.userStore.getUserSilently();
    const role = this.userStore.userRole();
    
    if (role === 'AUXILIAR' && user?.auxiliar) {
      return `${user.auxiliar.nombre} ${user.auxiliar.apellido}`;
    } else if (role === 'ADMINISTRADOR' && user?.administrador) {
      return `${user.administrador.nombres} ${user.administrador.apellidos}`;
    } else if (role === 'DIRECTOR' && user?.director) {
      return `${user.director.nombres} ${user.director.apellidos}`;
    }
    
    return 'Usuario no identificado';
  }

  get puedeActualizarAsistencias(): boolean {
    return this.userStore.canRegisterAttendance() && this.tieneIdValido();
  }

  private tieneIdValido(): boolean {
    const idAux = this.userStore.idAuxiliar();
    const user = this.userStore.getUserSilently();
    
    return !!(idAux || user?.administrador?.id_administrador || user?.director?.id_director);
  }

  // ========================================
  // MÉTODOS DE FECHA
  // ========================================
  private inicializarFecha(): void {
    this.fechaSeleccionada = this.asistenciaService.getFechaHoy();
  }

  get esFechaHoy(): boolean {
    return this.asistenciaService.esFechaHoy(this.fechaSeleccionada);
  }

  toggleFechaPersonalizada(): void {
    this.usarFechaPersonalizada = !this.usarFechaPersonalizada;
    
    if (!this.usarFechaPersonalizada) {
      // Volver a fecha de hoy
      this.fechaSeleccionada = this.asistenciaService.getFechaHoy();
    }
    
    this.forzarDeteccionCambios();
  }

  onFechaChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.fechaSeleccionada = target.value;
    this.forzarDeteccionCambios();
  }

  establecerFechaRapida(dias: number): void {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + dias);
    
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    
    this.fechaSeleccionada = `${año}-${mes}-${dia}`;
    this.forzarDeteccionCambios();
  }

  // ========================================
  // MÉTODOS DE DETECCIÓN DE CAMBIOS
  // ========================================
  private forzarDeteccionCambios(): void {
    this.cdr.detectChanges();
    setTimeout(() => this.cdr.detectChanges(), 0);
  }

  private forzarDeteccionConDelay(delay: number = 100): void {
    setTimeout(() => {
      this.cdr.detectChanges();
    }, delay);
  }

  /**
   * Inicializa los formularios reactivos
   */
  private initializeForms(): void {
    // Formulario para buscar alumno
    this.buscarForm = this.fb.group({
      codigo: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.pattern(/^[a-zA-Z0-9]+$/)
      ]]
    });

    // Formulario para actualizar asistencia
    this.actualizarForm = this.fb.group({
      hora_de_llegada: ['', [Validators.pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)]],
      hora_salida: ['', [Validators.pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)]],
      estado_asistencia: [''],
      motivo: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  /**
   * Busca y verifica la asistencia del alumno
   */
  onBuscarAlumno(): void {
    // Verificar permisos antes de buscar
    if (!this.puedeActualizarAsistencias) {
      this.mostrarErrorSinPermisos();
      return;
    }

    if (this.buscarForm.invalid) {
      this.markFormGroupTouched(this.buscarForm);
      return;
    }

    const codigo = this.buscarForm.get('codigo')?.value?.trim();
    if (!codigo) return;

    this.isLoading = true;
    this.resetUpdateForm();
    
    console.log('🔍 Buscando alumno con código:', codigo);
    console.log('📅 Para la fecha:', this.fechaSeleccionada);
    
    // Forzar actualización del DOM
    this.forzarDeteccionCambios();

    this.asistenciaService.verificarAsistenciaPorCodigo(codigo, this.fechaSeleccionada).subscribe({
      next: (response) => {
        console.log('✅ Respuesta del backend (verificar):', response);
        console.log('🔍 Datos del alumno:', response.alumno);
        console.log('🔍 Turno del alumno:', response.alumno?.turno);
        console.log('🔍 ¿Tiene turno?:', !!response.alumno?.turno);
        console.log('🔍 Verificando datos:', {
          tiene_asistencia: response.tiene_asistencia,
          tiene_asistencia_boolean: !!response.tiene_asistencia,
          asistencia: response.asistencia,
          tiene_asistencia_data: !!response.asistencia
        });
        
        this.alumnoData = response;
        
        if (response.tiene_asistencia && response.asistencia) {
          console.log('✅ Alumno tiene asistencia, mostrando formulario de actualización');
          // Tiene asistencia - mostrar formulario de actualización
          this.prepareUpdateForm(response);
          this.showUpdateForm = true;
          

        } else {
          console.log('❌ Alumno NO tiene asistencia, mostrando mensaje');
          // No tiene asistencia - solo mostrar info del alumno
          this.showUpdateForm = false;
          
          // Mostrar mensaje de error específico
          const nombreCompleto = response.alumno ? `${response.alumno.nombre} ${response.alumno.apellido}` : 'el estudiante';
          this.confirmationMessage = {
            type: 'error',
            title: 'Sin Asistencia',
            message: `No se encontró asistencia en la fecha ${this.fechaSeleccionada} para ${nombreCompleto}`,
            show: true
          };
        }
        
        this.isLoading = false;
        this.forzarDeteccionCambios();
        this.forzarDeteccionConDelay(100);
      },
      error: (error) => {
        console.error('💥 Error buscando alumno:', error);
        
        // Mostrar error personalizado
        this.confirmationMessage = {
          type: 'error',
          title: 'Error',
          message: error,
          show: true
        };
        
        this.showUpdateForm = false;
        this.isLoading = false;
        this.forzarDeteccionCambios();
      }
    });
  }

  /**
   * Prepara el formulario de actualización con los datos actuales
   */
  private prepareUpdateForm(data: VerificarAsistenciaResponse): void {
    if (!data.asistencia) return;

    console.log('📋 Preparando formulario con datos:', data.asistencia);

    this.actualizarForm.patchValue({
      hora_de_llegada: data.asistencia.hora_de_llegada,
      hora_salida: data.asistencia.hora_salida || '',
      estado_asistencia: data.asistencia.estado_asistencia,
      motivo: ''
    });

    console.log('✅ Formulario preparado:', {
      value: this.actualizarForm.value,
      valid: this.actualizarForm.valid,
      errors: this.actualizarForm.errors
    });

    this.forzarDeteccionCambios();
  }

  /**
   * Actualiza la asistencia del alumno
   */
  onActualizarAsistencia(): void {
    console.log('🚀 Método onActualizarAsistencia ejecutado');
    console.log('📋 Estado del formulario:', {
      valid: this.actualizarForm.valid,
      value: this.actualizarForm.value,
      errors: this.actualizarForm.errors
    });
    console.log('👤 Estado de alumnoData:', {
      alumnoData: this.alumnoData,
      tieneAlumno: !!this.alumnoData?.alumno,
      alumno: this.alumnoData?.alumno,
      codigo: this.alumnoData?.alumno?.codigo
    });
    
    // Verificar permisos antes de actualizar
    if (!this.puedeActualizarAsistencias) {
      console.warn('⚠️ Sin permisos para actualizar asistencia');
      this.mostrarErrorSinPermisos();
      return;
    }
    console.log('✅ Permisos verificados correctamente');

    if (!this.tieneIdValido()) {
      this.confirmationMessage = {
        type: 'error',
        title: 'Error de Usuario',
        message: 'No se pudo obtener la información del usuario. Verifica tu sesión.',
        show: true
      };
      return;
    }
    console.log('✅ ID del usuario verificado correctamente');

    console.log('🔍 Verificando alumnoData:', {
      alumnoData: this.alumnoData,
      tieneAlumno: !!this.alumnoData?.alumno,
      alumno: this.alumnoData?.alumno
    });
    
    // Verificar si tenemos los datos necesarios para actualizar
    if (this.actualizarForm.invalid) {
      console.warn('⚠️ Formulario inválido');
      this.markFormGroupTouched(this.actualizarForm);
      return;
    }

    // Verificar si tenemos asistencia para actualizar
    if (!this.alumnoData?.asistencia) {
      console.warn('⚠️ No hay datos de asistencia para actualizar');
      return;
    }

    console.log('✅ Formulario y datos de asistencia verificados correctamente');

    this.isLoadingUpdate = true;
    console.log('⏳ Estado de carga de actualización activado:', this.isLoadingUpdate);
    this.forzarDeteccionCambios();

    const formValues = this.actualizarForm.value;
    const updateData: UpdateAsistenciaRequest = {
      motivo: formValues.motivo
    };

    // 🔥 LÓGICA DE ROLES DINÁMICOS (igual que registro manual)
    const idAux = this.userStore.idAuxiliar();
    const user = this.userStore.getUserSilently();
    
    console.log('🔍 [ACTUALIZAR ASISTENCIA] Construyendo payload:');
    console.log('- Usuario logueado:', user);
    console.log('- ID Auxiliar disponible:', idAux);
    console.log('- Rol del usuario:', this.userStore.userRole());
    
    if (idAux) {
      updateData.id_auxiliar = idAux;
      console.log('✅ [ACTUALIZAR ASISTENCIA] Enviando como AUXILIAR con id_auxiliar:', idAux);
    } else if (user?.administrador?.id_administrador) {
      updateData.id_usuario = user.administrador.id_administrador;
      console.log('✅ [ACTUALIZAR ASISTENCIA] Enviando como ADMINISTRADOR con id_usuario:', user.administrador.id_administrador);
    } else if (user?.director?.id_director) {
      updateData.id_usuario = user.director.id_director;
      console.log('✅ [ACTUALIZAR ASISTENCIA] Enviando como DIRECTOR con id_usuario:', user.director.id_director);
    } else {
      console.error('❌ [ACTUALIZAR ASISTENCIA] ERROR: No se pudo determinar el actor de la actualización');
      this.confirmationMessage = {
        type: 'error',
        title: 'Error de Usuario',
        message: 'No se pudo determinar los permisos del usuario. Verifica tu sesión.',
        show: true
      };
      this.isLoadingUpdate = false;
      this.forzarDeteccionCambios();
      return;
    }

    // Solo incluir campos que han cambiado o tienen valor
    if (formValues.hora_de_llegada && formValues.hora_de_llegada.trim()) {
      updateData.hora_de_llegada = formValues.hora_de_llegada.trim();
    }

    if (formValues.hora_salida && formValues.hora_salida.trim()) {
      updateData.hora_salida = formValues.hora_salida.trim();
    }

    if (formValues.estado_asistencia) {
      updateData.estado_asistencia = formValues.estado_asistencia;
    }

    // 📅 AGREGAR FECHA SI ES DIFERENTE A HOY
    if (this.fechaSeleccionada && !this.asistenciaService.esFechaHoy(this.fechaSeleccionada)) {
      updateData.fecha = this.fechaSeleccionada;
      console.log('📅 [ACTUALIZAR ASISTENCIA] Fecha personalizada agregada:', updateData.fecha);
    }

    // Obtener el código del alumno del formulario de búsqueda
    const codigo = this.buscarForm.get('codigo')?.value?.trim();
    if (!codigo) {
      console.error('💥 No se pudo obtener el código del alumno del formulario de búsqueda');
      return;
    }

    // Debug: Log antes de hacer la petición de actualización
    console.log('🔄 Actualizando asistencia para alumno:', codigo);
    console.log('📝 Datos que se enviarán al backend:', updateData);
    console.log('🌐 Endpoint que se llamará:', `${this.asistenciaService['baseUrl']}/actualizar/${codigo}`);
    console.log('👤 Usuario que realiza la actualización - Rol:', this.userStore.userRole());

    console.log('🚀 ANTES DE LLAMAR AL SERVICIO - Intentando enviar petición HTTP...');

    this.asistenciaService.actualizarAsistenciaPorCodigo(codigo, updateData).subscribe({
      next: (response) => {
        console.log('✅ SUSCRIPCIÓN NEXT EJECUTADA - Respuesta del backend recibida');
        // Debug: Log de la respuesta exitosa del backend
        console.log('✅ Respuesta exitosa del backend (actualizarAsistenciaPorCodigo):', response);
        console.log('📊 Estructura de la respuesta:', {
          success: response.success,
          mensaje: response.mensaje,
          asistencia_actualizada: response.asistencia_actualizada ? 'SÍ' : 'NO',
          alumno: response.alumno ? 'SÍ' : 'NO'
        });
        
        this.isLoadingUpdate = false;
        
        // Actualizar datos locales con la respuesta
        if (this.alumnoData && this.alumnoData.asistencia) {
          this.alumnoData.asistencia = {
            ...this.alumnoData.asistencia,
            ...response.asistencia_actualizada
          };
        }

        this.forzarDeteccionCambios();

        // Mostrar éxito con mensaje personalizado
        this.confirmationMessage = {
          type: 'success',
          title: '¡Actualización Exitosa!',
          message: 'La asistencia se ha actualizado correctamente',
          show: true
        };
      },
      error: (error) => {
        console.log('❌ SUSCRIPCIÓN ERROR EJECUTADA - Error del backend recibido');
        // Debug: Log detallado del error de actualización
        console.error('💥 Error actualizando asistencia:', error);
        console.error('📊 Estructura del error:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          error: error.error
        });
        console.error('🌐 URL que falló:', `${this.asistenciaService['baseUrl']}/actualizar/${codigo}`);
        console.error('📝 Datos que se intentaron enviar:', updateData);
        
        this.isLoadingUpdate = false;
        
        // Mostrar error personalizado
        this.confirmationMessage = {
          type: 'error',
          title: 'Error al Actualizar',
          message: error,
          show: true
        };
        
        this.forzarDeteccionCambios();
      }
    });
  }

  /**
   * Reinicia el formulario de búsqueda y oculta el formulario de actualización
   */
  onNuevaBusqueda(): void {
    this.limpiarFormularioCompleto();
  }

  /**
   * Limpia completamente todos los formularios y estados
   */
  private limpiarFormularioCompleto(): void {
    this.buscarForm.reset();
    this.resetUpdateForm();
    this.showUpdateForm = false;
    this.alumnoData = null;
    
    
    this.forzarDeteccionCambios();
    this.forzarDeteccionConDelay(100);
  }

  /**
   * Reinicia el formulario de actualización
   */
  private resetUpdateForm(): void {
    this.actualizarForm.reset();
    this.showUpdateForm = false;
  }

  /**
   * Muestra error cuando no hay permisos de auxiliar
   */
  private mostrarErrorSinPermisos(): void {
    this.confirmationMessage = {
      type: 'error',
      title: 'Sin Permisos de Auxiliar',
      message: 'Necesitas permisos de auxiliar para realizar esta acción.',
      show: true
    };
  }

  /**
   * Maneja la confirmación del mensaje de confirmación
   */
  onConfirmMessage(): void {
    this.confirmationMessage.show = false;
    
    // Si es un mensaje de éxito, limpiar el formulario
    if (this.confirmationMessage.type === 'success') {
      this.limpiarFormularioCompleto();
    }
  }

  /**
   * Marca todos los campos de un FormGroup como touched para mostrar validaciones
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
    this.forzarDeteccionCambios();
  }

  /**
   * Verifica si un campo tiene errores y ha sido tocado
   */
  hasFieldError(formGroup: FormGroup, fieldName: string): boolean {
    const field = formGroup.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  /**
   * Obtiene el mensaje de error para un campo específico
   */
  getFieldError(formGroup: FormGroup, fieldName: string): string {
    const field = formGroup.get(fieldName);
    if (!field || !field.errors || !field.touched) return '';

    const errors = field.errors;
    
    if (errors['required']) return 'Este campo es obligatorio';
    if (errors['minlength']) return `Mínimo ${errors['minlength'].requiredLength} caracteres`;
    if (errors['pattern']) {
      if (fieldName === 'codigo') return 'Solo se permiten letras y números';
      if (fieldName.includes('hora')) return 'Formato válido: HH:MM:SS (ej: 08:30:00)';
    }
    
    return 'Campo inválido';
  }

  /**
   * Verifica si el formulario de búsqueda es válido
   */
  get isBuscarFormValid(): boolean {
    return this.buscarForm.valid && this.puedeActualizarAsistencias;
  }

  /**
   * Verifica si el formulario de actualización es válido
   */
  get isActualizarFormValid(): boolean {
    const isValid = this.actualizarForm.valid && this.puedeActualizarAsistencias && this.tieneIdValido();
    console.log('🔍 Validación del formulario de actualización:', {
      formValid: this.actualizarForm.valid,
      puedeActualizar: this.puedeActualizarAsistencias,
      tieneIdValido: this.tieneIdValido(),
      resultado: isValid
    });
    return isValid;
  }



  /**
   * Obtiene el texto del estado de los botones
   */
  get estadoBuscarTexto(): string {
    if (!this.puedeActualizarAsistencias) return 'Sin permisos para actualizar';
    if (this.isLoading) return 'Buscando...';
    return 'Buscar Alumno';
  }

  get estadoActualizarTexto(): string {
    if (!this.puedeActualizarAsistencias) return 'Sin permisos para actualizar';
    if (!this.tieneIdValido()) return 'Usuario no autorizado';
    if (this.isLoadingUpdate) return 'Actualizando...';
    return 'Actualizar Asistencia';
  }
}