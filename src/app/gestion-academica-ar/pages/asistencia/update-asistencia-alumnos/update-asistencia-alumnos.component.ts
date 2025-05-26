// src/app/components/actualizar-asistencia/actualizar-asistencia.component.ts

import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AsistenciaService, EstadoAsistencia, UpdateAsistenciaRequest, VerificarAsistenciaResponse } from './service/UpdateAsistencia.service';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  imports: [ReactiveFormsModule, FormsModule, HttpClientModule, CommonModule],
  selector: 'app-actualizar-asistencia',
  templateUrl: './update-asistencia-alumnos.component.html',
})
export class ActualizarAsistenciaComponent implements OnInit {

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

  // ID del auxiliar (esto debería venir de la sesión/auth)
  private readonly auxiliarId = '158c6a01-1701-4c41-b732-d1b83c0a6e7b'; // TODO: Obtener del servicio de autenticación

  constructor(
    private fb: FormBuilder,
    private asistenciaService: AsistenciaService,
    private cdr: ChangeDetectorRef
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    // Componente inicializado
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
    if (this.buscarForm.invalid) {
      this.markFormGroupTouched(this.buscarForm);
      return;
    }

    const codigo = this.buscarForm.get('codigo')?.value?.trim();
    if (!codigo) return;

    this.isLoading = true;
    this.resetUpdateForm();
    
    // Forzar actualización del DOM
    this.cdr.detectChanges();

    this.asistenciaService.verificarAsistenciaPorCodigo(codigo).subscribe({
      next: (response) => {
        console.log('🔍 RESPUESTA COMPLETA:', response); // DEBUG
        console.log('🔍 ALUMNO DATA:', response.alumno); // DEBUG
        console.log('🔍 ASISTENCIA DATA:', response.asistencia); // DEBUG
        
        this.alumnoData = response;
        
        if (response.tiene_asistencia && response.asistencia) {
          // Tiene asistencia - mostrar formulario de actualización
          this.prepareUpdateForm(response);
          this.showUpdateForm = true;
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
        
        // Forzar actualización del DOM después de recibir respuesta
        this.cdr.detectChanges();
      },
      error: (error) => {
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
        
        // Forzar actualización del DOM en caso de error
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Prepara el formulario de actualización con los datos actuales
   */
  private prepareUpdateForm(data: VerificarAsistenciaResponse): void {
    if (!data.asistencia) return;

    this.actualizarForm.patchValue({
      hora_de_llegada: data.asistencia.hora_de_llegada,
      hora_salida: data.asistencia.hora_salida || '',
      estado_asistencia: data.asistencia.estado_asistencia,
      motivo: ''
    });
  }

  /**
   * Actualiza la asistencia del alumno
   */
  onActualizarAsistencia(): void {
    if (this.actualizarForm.invalid || !this.alumnoData?.alumno) {
      this.markFormGroupTouched(this.actualizarForm);
      return;
    }

    this.isLoadingUpdate = true;
    
    // Forzar actualización del DOM
    this.cdr.detectChanges();

    const formValues = this.actualizarForm.value;
    const updateData: UpdateAsistenciaRequest = {
      motivo: formValues.motivo,
      id_auxiliar: this.auxiliarId
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

    this.asistenciaService.actualizarAsistenciaPorCodigo(codigo, updateData).subscribe({
      next: (response) => {
        this.isLoadingUpdate = false;
        
        // Actualizar datos locales con la respuesta
        if (this.alumnoData && this.alumnoData.asistencia) {
          this.alumnoData.asistencia = {
            ...this.alumnoData.asistencia,
            ...response.asistencia_actualizada
          };
        }

        // Forzar actualización del DOM inmediatamente después de éxito
        this.cdr.detectChanges();

        // Mostrar éxito con SweetAlert2
        Swal.fire({
          icon: 'success',
          title: '¡Actualización Exitosa!',
          text: response.mensaje,
          timer: 3000,
          timerProgressBar: true,
          confirmButtonText: 'Continuar',
          confirmButtonColor: '#10b981'
        }).then(() => {
          // Limpiar TODO después de cerrar el alert
          this.buscarForm.reset();
          this.resetUpdateForm();
          this.showUpdateForm = false;
          this.alumnoData = null;
          
          // Forzar actualización del DOM después de limpiar
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        this.isLoadingUpdate = false;
        
        // Mostrar error con SweetAlert2
        Swal.fire({
          icon: 'error',
          title: 'Error al Actualizar',
          text: error,
          confirmButtonText: 'Cerrar',
          confirmButtonColor: '#d33'
        });
        
        // Forzar actualización del DOM en caso de error
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Reinicia el formulario de búsqueda y oculta el formulario de actualización
   */
  onNuevaBusqueda(): void {
    this.buscarForm.reset();
    this.resetUpdateForm();
    this.showUpdateForm = false;
    this.alumnoData = null;
    
    // Forzar actualización del DOM
    this.cdr.detectChanges();
  }

  /**
   * Reinicia el formulario de actualización
   */
  private resetUpdateForm(): void {
    this.actualizarForm.reset();
    this.showUpdateForm = false;
  }

  /**
   * Marca todos los campos de un FormGroup como touched para mostrar validaciones
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
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
    return this.buscarForm.valid;
  }

  /**
   * Verifica si el formulario de actualización es válido
   */
  get isActualizarFormValid(): boolean {
    return this.actualizarForm.valid;
  }

  /**
   * Obtiene información del turno formateada
   */
  get turnoInfo(): string {
    if (!this.alumnoData?.alumno?.turno) return '';
    const turno = this.alumnoData.alumno.turno;
    return `${turno.turno} (${turno.hora_inicio} - ${turno.hora_fin})`;
  }
}