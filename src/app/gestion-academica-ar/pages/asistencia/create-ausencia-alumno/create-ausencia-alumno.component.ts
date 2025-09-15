// components/registro-ausencias.component.ts
import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AsistenciaService, RegistroAusenciaAlumno, ResponseAusenciaAlumno, EstudianteInfo } from './service/AusenciaService.service';
import { CommonModule } from '@angular/common';
import { AlertsService } from '../../../../shared/alerts.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  imports: [CommonModule, ReactiveFormsModule],
  selector: 'app-registro-ausencias',
  templateUrl: './create-ausencia-alumno.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegistroAusenciasComponent implements OnInit {

  // Formulario reactivo
  personalForm: FormGroup;

  // Estados de carga
  loadingPersonal: boolean = false;
  buscandoEstudiante: boolean = false;

  // Estados de éxito
  successPersonal: string | null = null;

  // Estados de error
  errorPersonal: string | null = null;
  errorBusqueda: string | null = null;

  // Información del estudiante
  estudianteEncontrado: EstudianteInfo | null = null;

  constructor(
    private fb: FormBuilder,
    private asistenciaService: AsistenciaService,
    private cdr: ChangeDetectorRef,
    private alertsService: AlertsService
  ) {
    // Inicializar formulario personal
    this.personalForm = this.fb.group({
      codigo: ['', [Validators.required, Validators.minLength(3)]],
      fecha: [''] // Campo opcional para fecha específica
    });

    // Suscribirse a cambios en el campo código para búsqueda automática con debounce
    this.personalForm.get('codigo')?.valueChanges
      .pipe(
        debounceTime(300), // Debounce de 300ms para evitar búsquedas excesivas
        distinctUntilChanged() // Solo ejecutar si el valor realmente cambió
      )
      .subscribe(codigo => {
        if (codigo && codigo.length >= 8) {
          this.buscarEstudiante(codigo);
        } else if (codigo && codigo.length < 8) {
          this.limpiarBusqueda();
        }
        this.cdr.markForCheck(); // Marcar para detección de cambios
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
   * Busca información del estudiante por código
   */
  private buscarEstudiante(codigo: string): void {
    if (!codigo || codigo.length < 8) {
      return;
    }

    this.buscandoEstudiante = true;
    this.errorBusqueda = null;
    this.cdr.markForCheck();



    this.asistenciaService.buscarEstudiantePorCodigo(codigo.trim()).subscribe({
      next: (response: any) => {

        
        // Manejar diferentes estructuras de respuesta
        let estudiante: EstudianteInfo;
        if (response.data) {
          estudiante = response.data;
        } else if (response.id_alumno) {
          estudiante = response;
        } else {
          throw new Error('Formato de respuesta no reconocido');
        }

        this.estudianteEncontrado = estudiante;
        this.buscandoEstudiante = false;
        this.errorBusqueda = null;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.alertsService.error('Error al buscar el estudiante', 'Error de Búsqueda');
        this.buscandoEstudiante = false;
        this.estudianteEncontrado = null;
        
        if (error.status === 404) {
          this.errorBusqueda = 'No se encontró ningún estudiante con ese código';
        } else {
          this.errorBusqueda = 'Error al buscar el estudiante. Intente nuevamente.';
        }
        
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Limpia la búsqueda y información del estudiante
   */
  private limpiarBusqueda(): void {
    this.estudianteEncontrado = null;
    this.errorBusqueda = null;
    this.buscandoEstudiante = false;
    this.cdr.markForCheck();
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



    // Llamar al servicio
    this.asistenciaService.crearAusenciaAlumno(data).subscribe({
      next: (response: any) => {
        this.loadingPersonal = false;
        
        // Debug: Log de la respuesta completa

        
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
        
        // Mostrar error con SweetAlert
        this.alertsService.error('Error al registrar la ausencia del estudiante', 'Error de Registro');
        
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
    this.errorBusqueda = null;
    this.cdr.markForCheck();
  }

  /**
   * Reinicia completamente el formulario
   */
  resetearTodo(): void {
    this.personalForm.reset();
    this.limpiarBusqueda();
    this.clearMessages();
    this.establecerFechaActual();
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