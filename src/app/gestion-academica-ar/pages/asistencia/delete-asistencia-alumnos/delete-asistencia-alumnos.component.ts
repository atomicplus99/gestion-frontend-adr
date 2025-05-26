// src/app/components/anular-asistencias/anular-asistencias.component.ts

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  AsistenciaService,
  Alumno,
  Asistencia,
  EstadoAsistencia,
  AnularAsistenciaRequest
} from './service/AnularAsistencia.service';

@Component({
  selector: 'app-anular-asistencias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Anular Asistencias del Día</h1>
        <p class="text-gray-600">{{ fechaHoy }}</p>
        <p class="text-sm text-blue-600 mt-1">
          ℹ️ Solo se pueden anular asistencias del día actual. Los registros anulados serán procesados automáticamente.
        </p>
      </div>

      <!-- Sección de Búsqueda -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">🔍 Buscar Estudiante</h2>
        
        <div class="flex gap-4 items-end">
          <div class="flex-1">
            <label for="codigoBusqueda" class="block text-sm font-medium text-gray-700 mb-2">
              Código del Estudiante
            </label>
            <input
              type="text"
              id="codigoBusqueda"
              [(ngModel)]="codigoBusqueda"
              placeholder="Ingrese el código del estudiante"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              [class.border-red-300]="errorBusqueda"
              (keyup.enter)="buscarEstudiante()"
            />
            <p *ngIf="errorBusqueda" class="text-red-500 text-sm mt-1">{{ errorBusqueda }}</p>
          </div>
          
          <button
            (click)="buscarEstudiante()"
            [disabled]="buscandoEstudiante || !codigoBusqueda.trim()"
            class="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors duration-200">
            <span *ngIf="!buscandoEstudiante">Buscar</span>
            <span *ngIf="buscandoEstudiante" class="flex items-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" class="opacity-25"></circle>
                <path fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" class="opacity-75"></path>
              </svg>
              Buscando...
            </span>
          </button>
          
          <button
            *ngIf="estudianteSeleccionado"
            (click)="limpiarBusqueda()"
            class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors duration-200">
            Limpiar
          </button>
        </div>
      </div>

      <!-- Información del Estudiante -->
      <div *ngIf="estudianteSeleccionado" class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">👤 Información del Estudiante</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <!-- Datos Personales -->
          <div class="space-y-2">
            <div>
              <span class="text-xs font-medium text-gray-500 uppercase">Nombre Completo</span>
              <p class="text-gray-900 font-semibold">{{ estudianteSeleccionado.nombre }} {{ estudianteSeleccionado.apellido }}</p>
            </div>
            <div>
              <span class="text-xs font-medium text-gray-500 uppercase">Código</span>
              <p class="text-gray-900 font-mono text-sm">{{ estudianteSeleccionado.codigo }}</p>
            </div>
          </div>
          
          <!-- Datos Académicos -->
          <div class="space-y-2">
            <div>
              <span class="text-xs font-medium text-gray-500 uppercase">Nivel/Grado</span>
              <p class="text-gray-900">{{ estudianteSeleccionado.nivel }} - {{ estudianteSeleccionado.grado }}° "{{ estudianteSeleccionado.seccion }}"</p>
            </div>
            <div>
              <span class="text-xs font-medium text-gray-500 uppercase">DNI</span>
              <p class="text-gray-900 font-mono text-sm">{{ estudianteSeleccionado.dni_alumno }}</p>
            </div>
          </div>
          
          <!-- Turno -->
          <div class="space-y-2">
            <div *ngIf="estudianteSeleccionado.turno">
              <span class="text-xs font-medium text-gray-500 uppercase">Turno</span>
              <p class="text-gray-900">{{ estudianteSeleccionado.turno.turno }}</p>
            </div>
            <div *ngIf="estudianteSeleccionado.turno">
              <span class="text-xs font-medium text-gray-500 uppercase">Horario</span>
              <p class="text-gray-900 text-sm">{{ estudianteSeleccionado.turno.hora_inicio }} - {{ estudianteSeleccionado.turno.hora_fin }}</p>
            </div>
          </div>

          <!-- Estado del Día -->
          <div class="space-y-2">
            <div>
              <span class="text-xs font-medium text-gray-500 uppercase">Estado Hoy</span>
              <p class="text-gray-900 font-semibold" [ngClass]="{
                'text-green-600': asistenciasHoy.length > 0 && tieneAsistenciaPuntualOTardanza(),
                'text-red-600': asistenciasHoy.length > 0 && tieneAsistenciaAnulada(),
                'text-gray-500': asistenciasHoy.length === 0
              }">
                {{ getEstadoDelDia() }}
              </p>
            </div>
            <div>
              <span class="text-xs font-medium text-gray-500 uppercase">Registros Hoy</span>
              <p class="text-gray-900 font-semibold">{{ asistenciasHoy.length }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Asistencias del Día -->
      <div *ngIf="estudianteSeleccionado" class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 class="text-lg font-semibold text-gray-900">
            📋 Asistencias de Hoy ({{ asistenciasHoy.length }})
          </h2>
          <button 
            (click)="cargarAsistenciasHoy()"
            [disabled]="cargandoAsistencias"
            class="text-sm bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-3 py-1 rounded transition-colors">
            <span *ngIf="!cargandoAsistencias">🔄 Actualizar</span>
            <span *ngIf="cargandoAsistencias">Actualizando...</span>
          </button>
        </div>

        <!-- Loading -->
        <div *ngIf="cargandoAsistencias" class="flex justify-center items-center h-32">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span class="ml-3 text-gray-600">Cargando asistencias de hoy...</span>
        </div>

        <!-- Error -->
        <div *ngIf="errorAsistencias && !cargandoAsistencias" class="p-6 text-center">
          <div class="text-gray-400 mb-4">
            <svg class="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
          </div>
          <p class="text-gray-600 mb-4">{{ errorAsistencias }}</p>
          <button 
            (click)="cargarAsistenciasHoy()"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
            Reintentar
          </button>
        </div>

        <!-- Tabla (Solo si hay asistencias) -->
        <div *ngIf="!cargandoAsistencias && !errorAsistencias && asistenciasHoy.length > 0" class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hora Llegada
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hora Salida
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let asistencia of asistenciasHoy; trackBy: trackByAsistencia" 
                  class="hover:bg-gray-50">
                
                <!-- Hora Llegada -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{{ asistencia.hora_de_llegada }}</div>
                </td>

                <!-- Hora Salida -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{{ asistencia.hora_salida || '-' }}</div>
                </td>

                <!-- Estado -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <span [ngClass]="obtenerInfoEstado(asistencia.estado_asistencia).color" 
                        class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                    {{ obtenerInfoEstado(asistencia.estado_asistencia).texto }}
                  </span>
                  <div class="text-xs text-gray-500 mt-1">
                    {{ obtenerInfoEstado(asistencia.estado_asistencia).descripcion }}
                  </div>
                </td>

                <!-- Acciones -->
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button 
                    *ngIf="puedeAnular(asistencia.estado_asistencia)"
                    (click)="abrirModalAnular(asistencia)"
                    [disabled]="procesandoAnulacion"
                    class="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded text-sm font-medium transition-colors duration-200">
                    <span *ngIf="!procesandoAnulacion || asistenciaSeleccionada?.id_asistencia !== asistencia.id_asistencia">
                      🗑️ Anular
                    </span>
                    <span *ngIf="procesandoAnulacion && asistenciaSeleccionada?.id_asistencia === asistencia.id_asistencia" class="flex items-center">
                      <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" class="opacity-25"></circle>
                        <path fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" class="opacity-75"></path>
                      </svg>
                      Anulando...
                    </span>
                  </button>
                  
                  <div *ngIf="!puedeAnular(asistencia.estado_asistencia)" class="space-y-1">
                    <span class="text-gray-400 text-sm">No se puede anular</span>
                    <div class="text-xs text-gray-400">
                      {{ getReasonCannotCancel(asistencia.estado_asistencia) }}
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Estado vacío -->
        <div *ngIf="!cargandoAsistencias && !errorAsistencias && asistenciasHoy.length === 0 && estudianteSeleccionado" 
             class="text-center py-16">
          <div class="text-gray-400 mb-4">
            <svg class="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">Sin asistencias hoy</h3>
          <p class="text-gray-500">
            {{ estudianteSeleccionado.nombre }} no tiene registros de asistencia para el día de hoy.
          </p>
          <p class="text-sm text-gray-400 mt-2">
            Los registros aparecerán aquí cuando el estudiante marque su asistencia.
          </p>
        </div>
      </div>

      <!-- Estado inicial -->
      <div *ngIf="!estudianteSeleccionado && !buscandoEstudiante" 
           class="text-center py-20">
        <div class="text-gray-400 mb-6">
          <svg class="mx-auto h-20 w-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
          </svg>
        </div>
        <h3 class="text-xl font-medium text-gray-900 mb-3">Busque un Estudiante</h3>
        <p class="text-gray-500 mb-2">Ingrese el código de un estudiante para ver y gestionar sus asistencias del día</p>
        <p class="text-sm text-gray-400">Solo se pueden anular asistencias del día actual (PUNTUAL y TARDANZA)</p>
      </div>

      <!-- Modal Anular Asistencia -->
      <div *ngIf="mostrarModal" class="fixed inset-0 z-50 overflow-y-auto">
        <!-- Overlay -->
        <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" (click)="cerrarModal()"></div>
        
        <!-- Modal -->
        <div class="flex min-h-full items-center justify-center p-4">
          <div class="relative w-full max-w-md transform rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
            
            <!-- Header -->
            <div class="sm:flex sm:items-start">
              <div class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                <h3 class="text-lg font-medium leading-6 text-gray-900">
                  Anular Asistencia de Hoy
                </h3>
                <div class="mt-2">
                  <p class="text-sm text-gray-500">
                    ¿Estás seguro de que deseas anular la asistencia de 
                    <strong>{{ estudianteSeleccionado?.nombre }} {{ estudianteSeleccionado?.apellido }}</strong> del día de hoy?
                  </p>
                  <div class="mt-3 p-3 bg-gray-50 rounded">
                    <p class="text-xs text-gray-600">
                      <strong>📅 Fecha:</strong> Hoy - {{ fechaHoy }}
                    </p>
                    <p class="text-xs text-gray-600">
                      <strong>🕐 Hora:</strong> {{ asistenciaSeleccionada?.hora_de_llegada }}
                      <span *ngIf="asistenciaSeleccionada?.hora_salida"> - {{ asistenciaSeleccionada?.hora_salida }}</span>
                    </p>
                    <p class="text-xs text-gray-600">
                      <strong>📊 Estado actual:</strong> {{ obtenerInfoEstado(asistenciaSeleccionada!.estado_asistencia || 'PUNTUAL').texto }}
                    </p>
                  </div>
                  <div class="mt-3 p-3 bg-yellow-50 rounded border border-yellow-200">
                    <p class="text-xs text-yellow-800">
                      ⚠️ <strong>Importante:</strong> La asistencia anulada será procesada automáticamente como AUSENTE al final del día.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Formulario -->
            <form (ngSubmit)="confirmarAnulacion()" class="mt-5">
              <div class="mb-4">
                <label for="motivo" class="block text-sm font-medium text-gray-700 mb-2">
                  Motivo de la anulación *
                </label>
                <textarea
                  id="motivo"
                  [(ngModel)]="motivoAnulacion"
                  name="motivo"
                  rows="3"
                  required
                  maxlength="500"
                  placeholder="Ej: Registro incorrecto por error del sistema, estudiante no asistió realmente, etc."
                  class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  [class.border-red-500]="!motivoAnulacion && formularioEnviado"></textarea>
                
                <div class="flex justify-between items-center mt-1">
                  <p *ngIf="!motivoAnulacion && formularioEnviado" class="text-red-500 text-xs">
                    El motivo es obligatorio
                  </p>
                  <p class="text-xs text-gray-500">
                    {{ (motivoAnulacion || '').length }}/500
                  </p>
                </div>
              </div>

              <!-- Botones -->
              <div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="submit"
                  [disabled]="procesandoAnulacion || !(motivoAnulacion || '').trim()"
                  class="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:bg-gray-400 disabled:cursor-not-allowed sm:ml-3 sm:w-auto">
                  <span *ngIf="!procesandoAnulacion">Confirmar Anulación</span>
                  <span *ngIf="procesandoAnulacion" class="flex items-center">
                    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" class="opacity-25"></circle>
                      <path fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" class="opacity-75"></path>
                    </svg>
                    Procesando...
                  </span>
                </button>
                
                <button
                  type="button"
                  (click)="cerrarModal()"
                  [disabled]="procesandoAnulacion"
                  class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed sm:mt-0 sm:w-auto">
                  Cancelar
                </button>
              </div>
            </form>

          </div>
        </div>
      </div>

      <!-- Toast de éxito -->
      <div *ngIf="mostrarToastExito" 
           class="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 z-50">
        <div class="flex items-center">
          <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          {{ mensajeExito }}
        </div>
      </div>

      <!-- Toast de error -->
      <div *ngIf="mostrarToastError" 
           class="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 z-50">
        <div class="flex items-center">
          <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
          {{ mensajeError }}
        </div>
      </div>
    </div>
  `
})
export class AnularAsistenciasComponent implements OnInit {
  // Estados principales
  estudianteSeleccionado: Alumno | null = null;
  asistenciasHoy: Asistencia[] = [];
  asistenciaSeleccionada: Asistencia | null = null;

  // Búsqueda
  codigoBusqueda = '';
  buscandoEstudiante = false;
  errorBusqueda = '';

  // Asistencias
  cargandoAsistencias = false;
  errorAsistencias = '';

  // Modal y anulación
  mostrarModal = false;
  motivoAnulacion = '';
  formularioEnviado = false;
  procesandoAnulacion = false;

  // Toasts
  mostrarToastExito = false;
  mostrarToastError = false;
  mensajeExito = '';
  mensajeError = '';

  // Fecha
  fechaHoy = '';

  // Configuración
  idAuxiliar = '158c6a01-1701-4c41-b732-d1b83c0a6e7b'; // TODO: Obtener del servicio de auth

  constructor(
    private asistenciaService: AsistenciaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.fechaHoy = this.asistenciaService.obtenerFechaHoy();
    console.log('🚀 Componente de anulaciones inicializado para:', this.fechaHoy);
  }

  // ===============================
  // FUNCIONES DE BÚSQUEDA
  // ===============================

  buscarEstudiante() {
    if (!this.codigoBusqueda?.trim()) {
      this.errorBusqueda = 'El código es obligatorio';
      return;
    }

    this.buscandoEstudiante = true;
    this.errorBusqueda = '';
    this.cdr.detectChanges();

    this.asistenciaService.buscarAlumnoPorCodigo(this.codigoBusqueda.trim()).subscribe({
      next: (alumno) => {
        console.log('✅ Estudiante encontrado:', alumno);
        this.estudianteSeleccionado = alumno;
        this.buscandoEstudiante = false;
        this.cargarAsistenciasHoy();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error buscando estudiante:', error);
        this.buscandoEstudiante = false;
        this.estudianteSeleccionado = null;
        this.asistenciasHoy = [];
        
        if (error.status === 404) {
          this.errorBusqueda = 'No se encontró ningún estudiante con ese código';
        } else {
          this.errorBusqueda = 'Error al buscar el estudiante. Intente nuevamente.';
        }
        
        this.cdr.detectChanges();
      }
    });
  }

  limpiarBusqueda() {
    this.codigoBusqueda = '';
    this.estudianteSeleccionado = null;
    this.asistenciasHoy = [];
    this.errorBusqueda = '';
    this.errorAsistencias = '';
    this.cdr.detectChanges();
  }

  // ===============================
  // FUNCIONES DE ASISTENCIAS
  // ===============================

  cargarAsistenciasHoy() {
    if (!this.estudianteSeleccionado) return;

    this.cargandoAsistencias = true;
    this.errorAsistencias = '';
    this.cdr.detectChanges();

    this.asistenciaService.obtenerAsistenciasHoyAlumno(this.estudianteSeleccionado.codigo).subscribe({
      next: (asistencias: Asistencia[]) => {
        console.log('✅ Asistencias de hoy cargadas:', asistencias.length);
        this.asistenciasHoy = asistencias.sort((a, b) => 
          a.hora_de_llegada.localeCompare(b.hora_de_llegada)
        );
        this.cargandoAsistencias = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error cargando asistencias de hoy:', error);
        this.cargandoAsistencias = false;
        
        if (error.status === 404) {
          this.errorAsistencias = 'Este estudiante no tiene asistencias registradas para hoy';
          this.asistenciasHoy = [];
        } else {
          this.errorAsistencias = 'Error al cargar las asistencias. Intente nuevamente.';
        }
        
        this.cdr.detectChanges();
      }
    });
  }

  // ===============================
  // FUNCIONES DE ESTADO
  // ===============================

  getEstadoDelDia(): string {
    if (this.asistenciasHoy.length === 0) {
      return 'Sin registro';
    }

    if (this.tieneAsistenciaAnulada()) {
      return 'Anulado';
    }

    if (this.tieneAsistenciaPuntualOTardanza()) {
      return 'Presente';
    }

    return 'Otro estado';
  }

  tieneAsistenciaPuntualOTardanza(): boolean {
    return this.asistenciasHoy.some(a => 
      a.estado_asistencia === EstadoAsistencia.PUNTUAL || 
      a.estado_asistencia === EstadoAsistencia.TARDANZA
    );
  }

  tieneAsistenciaAnulada(): boolean {
    return this.asistenciasHoy.some(a => 
      a.estado_asistencia === EstadoAsistencia.ANULADO
    );
  }

  // ===============================
  // FUNCIONES DE ANULACIÓN
  // ===============================

  abrirModalAnular(asistencia: Asistencia) {
    this.asistenciaSeleccionada = asistencia;
    this.motivoAnulacion = '';
    this.formularioEnviado = false;
    this.mostrarModal = true;
    this.cdr.detectChanges();
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.asistenciaSeleccionada = null;
    this.motivoAnulacion = '';
    this.formularioEnviado = false;
    this.cdr.detectChanges();
  }

  confirmarAnulacion() {
    this.formularioEnviado = true;
    this.cdr.detectChanges();

    if (!(this.motivoAnulacion || '').trim()) {
      return;
    }

    if (!this.asistenciaSeleccionada || !this.estudianteSeleccionado) {
      return;
    }

    this.procesandoAnulacion = true;
    this.cdr.detectChanges();

    // ✅ SIN FECHA - SIEMPRE DÍA ACTUAL
    const request: AnularAsistenciaRequest = {
      codigo_estudiante: this.estudianteSeleccionado.codigo,
      motivo: this.motivoAnulacion.trim(),
      id_auxiliar: this.idAuxiliar
      // ✅ No incluir fecha - el backend usa día actual
    };

    console.log('🗑️ Enviando solicitud de anulación para hoy:', request);

    this.asistenciaService.anularAsistencia(request).subscribe({
      next: (response) => {
        console.log('✅ Asistencia anulada exitosamente:', response);
        
        // Actualizar estado local
        const index = this.asistenciasHoy.findIndex(a => 
          a.id_asistencia === this.asistenciaSeleccionada!.id_asistencia
        );
        
        if (index !== -1) {
          this.asistenciasHoy[index].estado_asistencia = EstadoAsistencia.ANULADO;
        }

        this.procesandoAnulacion = false;
        this.cerrarModal();
        
        this.mensajeExito = 'Asistencia de hoy anulada correctamente';
        this.mostrarToastExito = true;
        
        this.cdr.detectChanges();

        setTimeout(() => {
          this.mostrarToastExito = false;
          this.cdr.detectChanges();
        }, 4000);
      },
      error: (error) => {
        console.error('❌ Error anulando asistencia:', error);
        this.procesandoAnulacion = false;
        this.cerrarModal();
        
        this.mensajeError = error.error?.message || 'Error al anular la asistencia';
        this.mostrarToastError = true;
        
        this.cdr.detectChanges();

        setTimeout(() => {
          this.mostrarToastError = false;
          this.cdr.detectChanges();
        }, 5000);
      }
    });
  }

  // ===============================
  // FUNCIONES AUXILIARES
  // ===============================

  trackByAsistencia(index: number, asistencia: Asistencia): string {
    return asistencia.id_asistencia;
  }

  puedeAnular(estado: EstadoAsistencia): boolean {
    return this.asistenciaService.puedeAnular(estado);
  }

  obtenerInfoEstado(estado: EstadoAsistencia) {
    return this.asistenciaService.obtenerInfoEstado(estado);
  }

  getReasonCannotCancel(estado: EstadoAsistencia): string {
    switch (estado) {
      case EstadoAsistencia.ANULADO:
        return 'Ya está anulado';
      case EstadoAsistencia.AUSENTE:
        return 'Las ausencias no se anulan';
      case EstadoAsistencia.JUSTIFICADO:
        return 'Use interfaz de justificaciones';
      default:
        return 'Estado no anulable';
    }
  }
}