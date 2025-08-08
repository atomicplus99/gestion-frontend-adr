// src/app/components/actualizar-asistencia/actualizar-asistencia.component.ts

import { ChangeDetectorRef, Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AsistenciaService, EstadoAsistencia, UpdateAsistenciaRequest, VerificarAsistenciaResponse } from './service/UpdateAsistencia.service';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import { UserStoreService } from '../../../../auth/store/user.store';

// Importar el UserStoreService
// Ajusta la ruta según tu estructura

@Component({
  imports: [ReactiveFormsModule, FormsModule, HttpClientModule, CommonModule],
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

  // Datos del alumno y asistencia
  alumnoData: VerificarAsistenciaResponse | null = null;

  // Opciones para select
  estadosAsistencia = [
    { value: EstadoAsistencia.PUNTUAL, label: 'Puntual' },
    { value: EstadoAsistencia.TARDANZA, label: 'Tardanza' }
  ];

  // Subject para manejo de suscripciones
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private asistenciaService: AsistenciaService,
    private userStore: UserStoreService, // 🔥 Inyectar UserStoreService
    private cdr: ChangeDetectorRef
  ) {
    this.initializeForms();
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
    if (!this.puedeActualizarAsistencia) {
      Swal.fire({
        icon: 'error',
        title: 'Sin Permisos',
        text: 'No tienes permisos de auxiliar para actualizar asistencias.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#dc2626'
      });
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
  // GETTERS PARA AUXILIAR
  // ========================================
  get idAuxiliarActual(): string | null {
    return this.userStore.idAuxiliar;
  }

  get nombreAuxiliarActual(): string {
    const user = this.userStore.user();
    if (user?.auxiliarInfo) {
      return `${user.auxiliarInfo.nombre} ${user.auxiliarInfo.apellido}`;
    }
    return 'Auxiliar no identificado';
  }

  get puedeActualizarAsistencia(): boolean {
    return this.userStore.puedeRegistrarAsistencia && !!this.idAuxiliarActual;
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
    if (!this.puedeActualizarAsistencia) {
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
    
    // Forzar actualización del DOM
    this.forzarDeteccionCambios();

    console.log('🔍 Buscando alumno con código:', codigo);
    console.log('👤 Auxiliar actual:', this.nombreAuxiliarActual, '- ID:', this.idAuxiliarActual);

    this.asistenciaService.verificarAsistenciaPorCodigo(codigo).subscribe({
      next: (response) => {
        console.log('🔍 RESPUESTA COMPLETA:', response);
        console.log('🔍 ALUMNO DATA:', response.alumno);
        console.log('🔍 ASISTENCIA DATA:', response.asistencia);
        
        this.alumnoData = response;
        
        if (response.tiene_asistencia && response.asistencia) {
          // Tiene asistencia - mostrar formulario de actualización
          this.prepareUpdateForm(response);
          this.showUpdateForm = true;
          
          console.log('✅ Formulario de actualización habilitado');
        } else {
          // No tiene asistencia - solo mostrar info del alumno
          this.showUpdateForm = false;
          
          // Mostrar mensaje informativo con SweetAlert2
          Swal.fire({
            icon: 'info',
            title: 'Sin Asistencia',
            text: response.mensaje,
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#3085d6'
          });
        }
        
        this.isLoading = false;
        this.forzarDeteccionCambios();
        this.forzarDeteccionConDelay(100);
      },
      error: (error) => {
        console.error('💥 Error buscando alumno:', error);
        
        // Mostrar error con SweetAlert2
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error,
          confirmButtonText: 'Cerrar',
          confirmButtonColor: '#d33'
        });
        
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

    console.log('📝 Preparando formulario con datos:', data.asistencia);

    this.actualizarForm.patchValue({
      hora_de_llegada: data.asistencia.hora_de_llegada,
      hora_salida: data.asistencia.hora_salida || '',
      estado_asistencia: data.asistencia.estado_asistencia,
      motivo: ''
    });

    this.forzarDeteccionCambios();
  }

  /**
   * Actualiza la asistencia del alumno
   */
  onActualizarAsistencia(): void {
    // Verificar permisos antes de actualizar
    if (!this.puedeActualizarAsistencia) {
      this.mostrarErrorSinPermisos();
      return;
    }

    if (!this.idAuxiliarActual) {
      Swal.fire({
        icon: 'error',
        title: 'Error de Auxiliar',
        text: 'No se pudo obtener el ID del auxiliar. Verifica tu sesión.',
        confirmButtonText: 'Cerrar',
        confirmButtonColor: '#d33'
      });
      return;
    }

    if (this.actualizarForm.invalid || !this.alumnoData?.alumno) {
      this.markFormGroupTouched(this.actualizarForm);
      return;
    }

    this.isLoadingUpdate = true;
    this.forzarDeteccionCambios();

    const formValues = this.actualizarForm.value;
    const updateData: UpdateAsistenciaRequest = {
      motivo: formValues.motivo,
      id_auxiliar: this.idAuxiliarActual // 🔥 Usar ID dinámico del UserStore
    };

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

    const codigo = this.alumnoData.alumno.codigo;

    console.log('📤 Enviando actualización:', updateData);
    console.log('👤 Auxiliar responsable:', this.nombreAuxiliarActual);

    this.asistenciaService.actualizarAsistenciaPorCodigo(codigo, updateData).subscribe({
      next: (response) => {
        console.log('✅ Actualización exitosa:', response);
        
        this.isLoadingUpdate = false;
        
        // Actualizar datos locales con la respuesta
        if (this.alumnoData && this.alumnoData.asistencia) {
          this.alumnoData.asistencia = {
            ...this.alumnoData.asistencia,
            ...response.asistencia_actualizada
          };
        }

        this.forzarDeteccionCambios();

        // Mostrar éxito con información del auxiliar
        Swal.fire({
          icon: 'success',
          title: '¡Actualización Exitosa!',
          html: `
            <div style="text-align: left; font-size: 14px;">
              <p><strong>📝 Mensaje:</strong> ${response.mensaje}</p>
              <p><strong>👤 Auxiliar:</strong> ${this.nombreAuxiliarActual}</p>
              <p><strong>🆔 ID Auxiliar:</strong> ${this.idAuxiliarActual}</p>
              <p><strong>📅 Fecha:</strong> ${new Date().toLocaleString()}</p>
            </div>
          `,
          timer: 5000,
          timerProgressBar: true,
          confirmButtonText: 'Continuar',
          confirmButtonColor: '#10b981'
        }).then(() => {
          // Limpiar TODO después de cerrar el alert
          this.limpiarFormularioCompleto();
        });
      },
      error: (error) => {
        console.error('💥 Error actualizando asistencia:', error);
        
        this.isLoadingUpdate = false;
        
        // Mostrar error con SweetAlert2
        Swal.fire({
          icon: 'error',
          title: 'Error al Actualizar',
          text: error,
          confirmButtonText: 'Cerrar',
          confirmButtonColor: '#d33'
        });
        
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
    
    console.log('🧹 Formularios limpiados');
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
    Swal.fire({
      icon: 'error',
      title: 'Sin Permisos de Auxiliar',
      text: 'Necesitas permisos de auxiliar para realizar esta acción.',
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#dc2626'
    });
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
    return this.buscarForm.valid && this.puedeActualizarAsistencia;
  }

  /**
   * Verifica si el formulario de actualización es válido
   */
  get isActualizarFormValid(): boolean {
    return this.actualizarForm.valid && this.puedeActualizarAsistencia && !!this.idAuxiliarActual;
  }

  /**
   * Obtiene información del turno formateada
   */
  get turnoInfo(): string {
    if (!this.alumnoData?.alumno?.turno) return '';
    const turno = this.alumnoData.alumno.turno;
    return `${turno.turno} (${turno.hora_inicio} - ${turno.hora_fin})`;
  }

  /**
   * Obtiene el texto del estado de los botones
   */
  get estadoBuscarTexto(): string {
    if (!this.puedeActualizarAsistencia) return 'Sin permisos de auxiliar';
    if (this.isLoading) return 'Buscando...';
    return 'Buscar Alumno';
  }

  get estadoActualizarTexto(): string {
    if (!this.puedeActualizarAsistencia) return 'Sin permisos de auxiliar';
    if (!this.idAuxiliarActual) return 'ID auxiliar no disponible';
    if (this.isLoadingUpdate) return 'Actualizando...';
    return 'Actualizar Asistencia';
  }
}