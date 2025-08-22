// components/buscar-estudiante/buscar-estudiante.component.ts
import { Component, OnInit, OnDestroy, ChangeDetectorRef, AfterViewInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ConfirmationMessageComponent, ConfirmationMessage } from '../../../../../../shared/components/confirmation-message/confirmation-message.component';

import { SelectorFechaComponent } from '../selector-fecha/selector-fecha.component';
import { RegistroAsistenciaServiceManual } from '../../services/register-asistencia.service';

@Component({
  selector: 'app-buscar-estudiante',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SelectorFechaComponent],
  changeDetection: ChangeDetectionStrategy.OnPush, // Optimización de rendimiento
  template: `
    <div class="bg-white rounded-lg shadow-md border border-blue-200 h-fit sticky top-6">
      <div class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-t-lg">
        <div class="flex items-center space-x-3">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          <div>
            <h2 class="text-lg font-bold">Buscar Estudiante</h2>
            <p class="text-blue-100 text-sm">Ingrese el código para verificar</p>
          </div>
        </div>
      </div>
      
      <div class="p-6">
        <!-- Selector de fecha -->
        <div class="mb-6">
          <app-selector-fecha></app-selector-fecha>
        </div>

        <form [formGroup]="buscarForm" (ngSubmit)="verificarAsistencia()">
          <div class="space-y-4">
            <label for="codigo" class="block text-sm font-bold text-gray-800">
              Código del Estudiante <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <input
                type="text"
                id="codigo"
                formControlName="codigo"
                placeholder="Código del estudiante"
                autocomplete="off"
                spellcheck="false"
                class="w-full px-4 py-3 text-base border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                [class.border-red-400]="buscarForm.get('codigo')?.invalid && buscarForm.get('codigo')?.touched"
                [class.border-green-400]="buscarForm.get('codigo')?.valid && buscarForm.get('codigo')?.value?.length >= 8"
                (input)="onInputChange($event)"
                (keyup.enter)="verificarAsistencia()"
              />
              <div class="absolute inset-y-0 right-0 flex items-center pr-3">
                <div *ngIf="verificando" class="animate-spin w-5 h-5 text-gray-600">
                  <svg fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <div *ngIf="!verificando && buscarForm.get('codigo')?.valid && buscarForm.get('codigo')?.value?.length >= 8" 
                     class="w-5 h-5 text-green-600">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
              </div>
            </div>
            
            <button
              type="submit"
              [disabled]="verificando || buscarForm.invalid"
              (click)="onClickBuscar($event)"
              class="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200"
              [class.animate-pulse]="verificando">
              <span *ngIf="verificando" class="flex items-center justify-center">
                <svg class="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Buscando...
              </span>
              <span *ngIf="!verificando" class="flex items-center justify-center">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
                Buscar Estudiante
              </span>
            </button>
            
            <!-- Estado del Input -->
            <div class="space-y-2">
              <div *ngIf="getCodigoLength() > 0 && getCodigoLength() < 8" 
                   class="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                <svg class="w-4 h-4 text-blue-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span class="text-sm text-blue-700 font-medium">{{ getCodigoLength() }}/8 caracteres mínimos</span>
              </div>
              <div *ngIf="buscarForm.get('codigo')?.valid && getCodigoLength() >= 8" 
                   class="flex items-center p-3 bg-green-50 rounded-lg border border-green-200">
                <svg class="w-4 h-4 text-green-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span class="text-sm text-green-700 font-medium">Código válido - Búsqueda automática activada</span>
              </div>
              <div *ngIf="buscarForm.get('codigo')?.invalid && buscarForm.get('codigo')?.touched" 
                   class="flex items-center p-3 bg-red-50 rounded-lg border border-red-200">
                <svg class="w-4 h-4 text-red-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
                <span class="text-sm text-red-700 font-medium">Código inválido - Solo letras y números</span>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>

    <!-- Panel de Control Rápido -->
    <div class="bg-white rounded-2xl shadow-xl border border-gray-100 mt-6 p-6">
      <h3 class="text-lg font-bold text-gray-800 mb-4">🚀 Acciones Rápidas</h3>
      <div class="space-y-3">
        <button 
          (click)="resetearTodo()"
          class="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors duration-200 flex items-center justify-center">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          Reiniciar Sistema
        </button>
        <button 
          *ngIf="tieneAsistencia"
          (click)="buscarOtro()"
          class="w-full px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium rounded-lg transition-colors duration-200 flex items-center justify-center">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          Buscar Otro Estudiante
        </button>
        
        <!-- Información del estado actual -->
        <div *ngIf="tieneAsistencia || alumnoEncontrado" class="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p class="text-xs text-blue-800 font-medium">
            {{ estadoActualTexto }}
          </p>
        </div>
      </div>
    </div>
  `
})
export class BuscarEstudianteComponent implements OnInit, OnDestroy, AfterViewInit {
  buscarForm!: FormGroup;
  verificando = false;
  tieneAsistencia = false;
  alumnoEncontrado: any = null;
  private searchTimeout: any;
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
    private registroService: RegistroAsistenciaServiceManual,
    private cdr: ChangeDetectorRef
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.configurarValidacionesTiempoReal();
    this.configurarSuscripciones();
  }

  ngAfterViewInit(): void {
    // Forzar detección y auto-focus
    this.cdr.detectChanges();
    this.enfocarInput();
  }

  ngOnDestroy(): void {
    this.limpiarTimeouts();
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========================================
  // MÉTODOS DE INICIALIZACIÓN
  // ========================================
  private initForm(): void {
    this.buscarForm = this.fb.group({
      codigo: ['', [
        Validators.required, 
        Validators.minLength(5),
        Validators.pattern(/^[A-Za-z0-9]+$/)
      ]]
    });
  }

  private configurarValidacionesTiempoReal(): void {
    this.buscarForm.get('codigo')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(codigo => {
        this.manejarCambioCodigo(codigo);
      });
  }

  private configurarSuscripciones(): void {
    // Suscripciones configuradas en el servicio
  }

  // ========================================
  // MÉTODOS DE DETECCIÓN OPTIMIZADOS
  // ========================================
  // Nota: Se usa cdr.markForCheck() en lugar de detectChanges() para mejor rendimiento

  // ========================================
  // GETTERS PARA EL TEMPLATE
  // ========================================
  get estadoActualTexto(): string {
    if (this.tieneAsistencia) {
      return '⚠️ Estudiante con asistencia registrada';
    } else if (this.alumnoEncontrado) {
      return '✅ Estudiante listo para registro';
    }
    return '';
  }

  getCodigoLength(): number {
    return this.buscarForm.get('codigo')?.value?.length || 0;
  }

  // ========================================
  // MANEJADORES DE EVENTOS
  // ========================================
  onClickBuscar(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    // Llamar verificación inmediatamente
    this.verificarAsistencia();
  }

  onInputChange(event: any): void {
    const valor = event.target.value?.toUpperCase();
    if (valor !== this.buscarForm.get('codigo')?.value) {
      this.buscarForm.patchValue({ codigo: valor }, { emitEvent: false });
      this.cdr.markForCheck();
    }
  }

  private manejarCambioCodigo(codigo: string): void {
    // Limpiar timeout anterior
    this.limpiarTimeouts();
    
    if (!codigo) {
      this.registroService.limpiarEstados();
      this.cdr.markForCheck();
      return;
    }
    
    // Auto-buscar cuando el código tenga 8+ caracteres (más rápido)
    if (codigo.length >= 8) {
      this.searchTimeout = setTimeout(() => {
        this.verificarAsistencia();
      }, 300); // Reducido de 800ms a 300ms
    }
  }

  // ========================================
  // MÉTODO PRINCIPAL DE VERIFICACIÓN
  // ========================================
  async verificarAsistencia(): Promise<void> {
    // Prevenir múltiples ejecuciones
    if (this.verificando) {
      return;
    }

    if (this.buscarForm.invalid) {
      await this.mostrarError(
        'Código Inválido', 
        'Por favor ingrese un código válido (mínimo 8 caracteres, solo letras y números).'
      );
      return;
    }
    
    const codigo = this.buscarForm.get('codigo')?.value?.trim().toUpperCase();
    if (!codigo || codigo.length < 8) {
      await this.mostrarError(
        'Código Muy Corto',
        `El código debe tener al menos 8 caracteres. Actual: ${codigo?.length || 0}`
      );
      return;
    }
    
    this.setEstadoVerificacion(true);
    
    try {
      const response = await this.registroService.verificarAsistencia(codigo).toPromise();
      
      // Procesar respuesta inmediatamente
      await this.procesarRespuestaVerificacion(response, codigo);
      
      // Solo una detección forzada después del procesamiento
      this.cdr.markForCheck();
      
    } catch (error: any) {
      this.registroService.limpiarEstados();
      await this.manejarErrorVerificacion(error, codigo);
    } finally {
      this.setEstadoVerificacion(false);
      this.cdr.markForCheck();
    }
  }

  private setEstadoVerificacion(verificando: boolean): void {
    this.verificando = verificando;
    this.cdr.markForCheck();
    
    if (verificando) {
      this.registroService.limpiarEstados();
    }
  }

  private async procesarRespuestaVerificacion(response: any, codigo: string): Promise<void> {
    if (response?.tiene_asistencia === true) {
      await this.manejarAsistenciaExistente(response);
    } else if (response?.tiene_asistencia === false && response?.alumno) {
      await this.manejarAlumnoEncontrado(response);
    } else {
      this.registroService.limpiarEstados();
      await this.mostrarError(
        'Respuesta Inesperada',
        'El servidor devolvió una respuesta que no se puede procesar. Intente nuevamente.'
      );
    }
  }

  private async manejarAsistenciaExistente(response: any): Promise<void> {
    // Actualizar estados
    this.registroService.setAsistenciaExistente(response.asistencia || null);
    this.registroService.setAlumnoEncontrado(null);
    
    // Solo forzar detección una vez
    this.cdr.markForCheck();
    
    // NO mostrar alerta - la información ya se muestra en la interfaz
    // Auto-limpiar formulario después de un breve delay
    setTimeout(() => {
      this.autoLimpiarFormulario();
    }, 2000);
  }

  private async manejarAlumnoEncontrado(response: any): Promise<void> {
    // Actualizar estados
    this.registroService.setAsistenciaExistente(null);
    this.registroService.setAlumnoEncontrado(response.alumno);
    
    // Solo una detección forzada
    this.cdr.markForCheck();
    
    // NO mostrar toast - la información ya se muestra en la interfaz
    // La información del estudiante se muestra automáticamente en la columna de información
  }

  private autoLimpiarFormulario(): void {
    setTimeout(() => {
      this.buscarForm.patchValue({ codigo: '' });
      this.cdr.markForCheck();
    }, 3000);
  }

  // ========================================
  // MANEJO DE ERRORES
  // ========================================
  private async manejarErrorVerificacion(error: any, codigo: string): Promise<void> {
    let titulo = 'Error de Verificación';
    let mensaje = '';
    
    if (error.status === 404) {
      titulo = 'Estudiante No Encontrado';
      mensaje = `No existe ningún estudiante con el código: ${codigo}\n\nVerifique que el código sea correcto.`;
    } else if (error.status === 0) {
      titulo = 'Error de Conexión';
      mensaje = 'No se puede conectar con el servidor.\n\nVerifique su conexión a internet.';
    } else if (error.status === 500) {
      titulo = 'Error del Servidor';
      mensaje = 'Error interno del servidor.\n\nIntente nuevamente en unos momentos.';
    } else {
      titulo = 'Error Inesperado';
      mensaje = `Error ${error.status}: ${error.error?.message || error.message || 'Error desconocido'}`;
    }
    
    await this.mostrarError(titulo, mensaje);
  }

  private async mostrarError(titulo: string, mensaje: string): Promise<void> {
    this.confirmationMessage = {
      type: 'error',
      title: titulo,
      message: mensaje,
      show: true
    };
  }

  /**
   * Maneja la confirmación del mensaje de confirmación
   */
  onConfirmMessage(): void {
    this.confirmationMessage.show = false;
  }

  // ========================================
  // ACCIONES DE CONTROL
  // ========================================
  resetearTodo(): void {
    this.buscarForm.reset();
    this.registroService.resetearTodo();
    this.limpiarTimeouts();
    this.cdr.markForCheck();
    
    // Enfocar después del reset
    setTimeout(() => this.enfocarInput(), 100);
  }

  buscarOtro(): void {
    this.buscarForm.reset();
    this.registroService.limpiarEstados();
    this.cdr.markForCheck();
    
    setTimeout(() => this.enfocarInput(), 100);
  }

  private enfocarInput(): void {
    const codigoInput = document.getElementById('codigo') as HTMLInputElement;
    if (codigoInput) {
      codigoInput.focus();
      codigoInput.select(); // Seleccionar todo el texto si hay
    }
  }

  private limpiarTimeouts(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = null;
    }
  }

  private actualizarEstadoLocal() {
    // Actualizar estado local basado en el servicio
    this.alumnoEncontrado = this.registroService.alumnoActual !== null;
    this.tieneAsistencia = this.registroService.asistenciaActual !== null;
    this.verificando = false;
  }
}