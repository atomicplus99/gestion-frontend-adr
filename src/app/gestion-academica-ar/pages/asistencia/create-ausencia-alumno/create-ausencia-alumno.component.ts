// components/registro-ausencias.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AsistenciaService, RegistroAusenciaAlumno, ResponseAusenciaAlumno } from './service/AusenciaService.service';
import { CommonModule } from '@angular/common';

@Component({
  imports: [CommonModule, ReactiveFormsModule],
  selector: 'app-registro-ausencias',
  templateUrl: './create-ausencia-alumno.component.html',
})
export class RegistroAusenciasComponent implements OnInit {

  // Formulario reactivo
  personalForm: FormGroup;

  // Estados de carga
  loadingPersonal: boolean = false;

  // Estados de éxito
  successPersonal: string | null = null;

  // Estados de error
  errorPersonal: string | null = null;

  constructor(
    private fb: FormBuilder,
    private asistenciaService: AsistenciaService,
    private cdr: ChangeDetectorRef
  ) {
    // Inicializar formulario personal
    this.personalForm = this.fb.group({
      codigo: ['', [Validators.required, Validators.minLength(3)]],
      fecha: [''] // Campo opcional para fecha específica
    });
  }

  ngOnInit(): void {
    // Inicialización del componente
    this.establecerFechaActual();
  }

  /**
   * Establece la fecha actual en la zona horaria de Perú (UTC-5)
   */
  private establecerFechaActual(): void {
    const fechaFormateada = this.obtenerFechaActualPeru();
    
    // Establecer la fecha actual en el formulario
    this.personalForm.patchValue({
      fecha: fechaFormateada
    });
  }

  /**
   * Obtiene la fecha actual en la zona horaria de Perú (UTC-5)
   * @returns string en formato YYYY-MM-DD
   */
  private obtenerFechaActualPeru(): string {
    // Obtener fecha actual en Perú (UTC-5)
    const fechaPeru = new Date();
    const offsetPeru = -5; // UTC-5 para Perú
    
    // Ajustar a la zona horaria de Perú
    const utc = fechaPeru.getTime() + (fechaPeru.getTimezoneOffset() * 60000);
    const fechaPeruAjustada = new Date(utc + (offsetPeru * 3600000));
    
    // Formatear como YYYY-MM-DD para el input type="date"
    return fechaPeruAjustada.toISOString().split('T')[0];
  }

  /**
   * Maneja el registro personal de ausencia
   */
  onRegistroPersonal(): void {
    // Validar formulario antes de enviar
    if (this.personalForm.invalid) {
      this.personalForm.markAllAsTouched();
      this.cdr.markForCheck();
      return;
    }

    this.loadingPersonal = true;
    this.clearMessages();
    this.cdr.markForCheck();

    // Preparar datos del formulario
    const data: RegistroAusenciaAlumno = {
      codigo: this.personalForm.value.codigo
    };

    // Siempre incluir la fecha, si no hay una específica, usar la actual de Perú
    if (this.personalForm.value.fecha && this.personalForm.value.fecha.trim()) {
      data.fecha = this.personalForm.value.fecha;
    } else {
      data.fecha = this.obtenerFechaActualPeru();
    }

    // Debug: Log de la fecha que se enviará
    console.log('Fecha que se enviará al backend:', data.fecha);
    console.log('Zona horaria del navegador:', Intl.DateTimeFormat().resolvedOptions().timeZone);

    // Llamar al servicio
    this.asistenciaService.crearAusenciaAlumno(data).subscribe({
      next: (response: any) => {
        this.loadingPersonal = false;
        
        // Debug: Log de la respuesta completa
        console.log('Respuesta del backend:', response);
        
        // Manejar la estructura real de la respuesta del backend
        if (response && response.success && response.data) {
          // Estructura: { success: true, message: "...", data: { message: "...", alumno: "...", codigo: "..." } }
          let mensajeExito = response.data.message || 'Ausencia registrada exitosamente';
          
          if (response.data.alumno && response.data.codigo) {
            mensajeExito += `. Estudiante: ${response.data.alumno} (${response.data.codigo})`;
          }
          
          this.successPersonal = mensajeExito;
        } else if (response && response.message) {
          // Estructura alternativa con message directo
          this.successPersonal = response.message;
        } else {
          // Respuesta sin estructura esperada, usar mensaje por defecto
          this.successPersonal = 'Ausencia registrada exitosamente';
        }
        
        this.personalForm.reset();
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.loadingPersonal = false;
        
        // Debug: Log del error completo
        console.error('Error completo:', error);
        
        // Manejar diferentes estructuras de error
        let mensajeError = 'Error al registrar ausencia del estudiante';
        
        if (error.error && error.error.message) {
          mensajeError = error.error.message;
        } else if (error.message) {
          mensajeError = error.message;
        } else if (error.status === 400) {
          mensajeError = 'Datos inválidos enviados al servidor';
        } else if (error.status === 404) {
          mensajeError = 'Estudiante no encontrado';
        } else if (error.status === 409) {
          mensajeError = 'Ya existe un registro de ausencia para este estudiante en la fecha especificada';
        } else if (error.status === 500) {
          mensajeError = 'Error interno del servidor';
        }
        
        this.errorPersonal = mensajeError;
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Limpia todos los mensajes de estado
   */
  clearMessages(): void {
    this.successPersonal = null;
    this.errorPersonal = null;
    this.cdr.markForCheck();
  }

  /**
   * Actualiza la fecha al día actual de Perú
   */
  actualizarFechaActual(): void {
    const fechaActual = this.obtenerFechaActualPeru();
    this.personalForm.patchValue({
      fecha: fechaActual
    });
    this.cdr.markForCheck();
  }

  /**
   * Getter para validación del campo código
   */
  get codigoInvalid(): boolean {
    const codigoControl = this.personalForm.get('codigo');
    return !!(codigoControl?.invalid && codigoControl?.touched);
  }
}