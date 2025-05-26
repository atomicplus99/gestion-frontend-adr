// components/registro-ausencias.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AsistenciaService, RegistroAusenciaAlumno, RegistroAusenciasMasivas, ResponseAusenciaAlumno, ResponseAusenciasMasivas } from './service/AusenciaService.service';
import { CommonModule } from '@angular/common';



@Component({
  imports: [CommonModule, ReactiveFormsModule],
  selector: 'app-registro-ausencias',
  templateUrl: './create-ausencia-alumno.component.html',
})
export class RegistroAusenciasComponent implements OnInit {

  duplicadosMasivo: string[] = [];
  // Formularios reactivos
  masivoForm: FormGroup;
  personalForm: FormGroup;

  // Estados de carga
  loadingMasivo: boolean = false;
  loadingPersonal: boolean = false;

  // Estados de éxito
  successMasivo: string | null = null;
  successPersonal: string | null = null;

  // Estados de error
  errorMasivo: string | null = null;
  errorPersonal: string | null = null;

  constructor(
    private fb: FormBuilder,
    private asistenciaService: AsistenciaService,
    private cdr: ChangeDetectorRef // Inyectar ChangeDetectorRef
  ) {
    // Inicializar formulario masivo
    this.masivoForm = this.fb.group({
      horaPersonalizada: [''] // Campo opcional para hora personalizada
    });

    // Inicializar formulario personal
    this.personalForm = this.fb.group({
      codigo: ['', [Validators.required, Validators.minLength(3)]],
      fecha: [''] // Campo opcional para fecha específica
    });
  }

  ngOnInit(): void {
    // Inicialización adicional si es necesaria
    console.log('Componente de registro de ausencias inicializado');
  }

  /**
   * Maneja el registro masivo de ausencias
   */
  onRegistroMasivo(): void {
    this.loadingMasivo = true;
    this.clearMasivoMessages();

    // Forzar detección de cambios para mostrar el loading
    this.cdr.detectChanges();

    // Preparar datos del formulario
    const data: RegistroAusenciasMasivas = {};

    if (this.masivoForm.value.horaPersonalizada) {
      data.horaPersonalizada = this.masivoForm.value.horaPersonalizada;
    }

    // Llamar al servicio
    this.asistenciaService.registrarAusenciasMasivas(data).subscribe({
      next: (response: ResponseAusenciasMasivas) => {
        this.loadingMasivo = false;
        this.duplicadosMasivo = response.duplicados; // NUEVA línea
        this.successMasivo = `${response.message}. Se registraron ${response.cantidadRegistradas} ausencias usando ${response.horaUsada}`;
        this.masivoForm.reset();
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loadingMasivo = false;
        this.errorMasivo = error.error?.message || 'Error al registrar ausencias masivas';

        // Forzar detección de cambios para mostrar el mensaje de error
        this.cdr.detectChanges();

        console.error('Error en registro masivo:', error);
      }
    });
  }

  /**
   * Maneja el registro personal de ausencia
   */
  onRegistroPersonal(): void {
    // Validar formulario antes de enviar
    if (this.personalForm.invalid) {
      this.personalForm.markAllAsTouched();
      this.cdr.detectChanges(); // Forzar detección de cambios para mostrar errores de validación
      return;
    }

    this.loadingPersonal = true;
    this.clearPersonalMessages();

    // Forzar detección de cambios para mostrar el loading
    this.cdr.detectChanges();

    // Preparar datos del formulario
    const data: RegistroAusenciaAlumno = {
      codigo: this.personalForm.value.codigo
    };

    if (this.personalForm.value.fecha) {
      data.fecha = this.personalForm.value.fecha;
    }

    // Llamar al servicio
    this.asistenciaService.crearAusenciaAlumno(data).subscribe({
      next: (response: ResponseAusenciaAlumno) => {
        this.loadingPersonal = false;
        this.successPersonal = `${response.message}. Alumno: ${response.asistencia.alumno} (${response.asistencia.codigo})`;
        this.personalForm.reset();

        // Forzar detección de cambios para mostrar el mensaje de éxito
        this.cdr.detectChanges();

        console.log('Registro personal exitoso:', response);
      },
      error: (error) => {
        this.loadingPersonal = false;
        this.errorPersonal = error.error?.message || 'Error al registrar ausencia del alumno';

        // Forzar detección de cambios para mostrar el mensaje de error
        this.cdr.detectChanges();

        console.error('Error en registro personal:', error);
      }
    });
  }

  /**
   * Limpia todos los mensajes de estado
   */
  clearMessages(): void {
    this.clearMasivoMessages();
    this.clearPersonalMessages();

    // Forzar detección de cambios para limpiar mensajes del DOM
    this.cdr.detectChanges();
  }

  /**
   * Limpia mensajes del registro masivo
   */
  private clearMasivoMessages(): void {
    this.successMasivo = null;
    this.errorMasivo = null;
    this.duplicadosMasivo = []; // NUEVA línea
  }

  /**
   * Limpia mensajes del registro personal
   */
  private clearPersonalMessages(): void {
    this.successPersonal = null;
    this.errorPersonal = null;
  }

  /**
   * Getter para validación del campo código
   */
  get codigoInvalid(): boolean {
    const codigoControl = this.personalForm.get('codigo');
    return !!(codigoControl?.invalid && codigoControl?.touched);
  }

  /**
   * Getter para obtener el mensaje de error del código
   */
  get codigoErrorMessage(): string {
    const codigoControl = this.personalForm.get('codigo');
    if (codigoControl?.hasError('required')) {
      return 'El código del alumno es requerido';
    }
    if (codigoControl?.hasError('minlength')) {
      return 'El código debe tener al menos 3 caracteres';
    }
    return '';
  }

  /**
   * Verifica si hay algún mensaje activo
   */
  get hasAnyMessage(): boolean {
    return !!(this.successMasivo || this.successPersonal || this.errorMasivo || this.errorPersonal);
  }

  /**
   * Maneja la tecla Enter en el formulario masivo
   */
  onMasivoKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !this.loadingMasivo) {
      this.onRegistroMasivo();
    }
  }

  /**
   * Maneja la tecla Enter en el formulario personal
   */
  onPersonalKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !this.loadingPersonal) {
      this.onRegistroPersonal();
    }
  }
}