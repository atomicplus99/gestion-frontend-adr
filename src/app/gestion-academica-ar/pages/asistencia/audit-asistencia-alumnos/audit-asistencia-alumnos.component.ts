// audit-asistencia-alumnos.component.ts
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { 
  AuditAsistenciaService, 
  ActualizacionAsistencia, 
  AuditAsistenciaResponse 
} from './service/audit-asistencia.service';
import { AlertsService } from '../../../../shared/alerts.service';

@Component({
  selector: 'app-audit-asistencia',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-white p-4">
      <div class="w-full">
        
        <!-- Header Principal - Estilo Dashboard -->
        <div class="mb-8">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                </svg>
              </div>
              <div>
                <h1 class="text-3xl font-bold text-gray-900">Auditoría de Asistencia</h1>
                <p class="text-gray-600">Sistema de seguimiento y control de modificaciones</p>
              </div>
            </div>
            <div class="flex items-center space-x-4">
              <div class="bg-gray-100 rounded-xl px-4 py-2">
                <span class="text-gray-600 text-sm">Total registros:</span>
                <span class="text-blue-600 font-bold text-lg ml-2">{{ totalRegistros }}</span>
              </div>
              <button 
                (click)="cargarActualizaciones()"
                [disabled]="cargando"
                class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                <span>Actualizar</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Panel de Filtros - Estilo Dashboard -->
        <div class="bg-gray-50 rounded-2xl p-6 mb-6 border border-gray-200">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-bold text-gray-900">Filtros de Búsqueda</h2>
            <div class="flex items-center space-x-4">
              <div class="text-sm text-gray-600">
                Mostrando <span class="text-blue-600 font-bold">{{ rangoRegistros }}</span> de 
                <span class="text-gray-900 font-bold">{{ actualizacionesFiltradas.length }}</span> registros filtrados
                <span class="text-gray-500">({{ totalRegistros }} total)</span>
              </div>
              <button 
                (click)="limpiarFiltros()"
                class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200">
                Limpiar
              </button>
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Código del Estudiante</label>
              <input 
                type="text" 
                [(ngModel)]="filtroCodigo"
                (ngModelChange)="aplicarFiltros()"
                placeholder="Ej: 22025445800308"
                class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Estado de Asistencia</label>
              <select 
                [(ngModel)]="filtroEstado"
                (ngModelChange)="aplicarFiltros()"
                class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200">
                <option value="">Todos los estados</option>
                <option value="PUNTUAL">Puntual</option>
                <option value="TARDANZA">Tardanza</option>
                <option value="AUSENTE">Ausente</option>
                <option value="JUSTIFICADO">Justificado</option>
                <option value="ANULADO">Anulado</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Fecha Desde</label>
              <input 
                type="date" 
                [(ngModel)]="filtroFechaDesde"
                (ngModelChange)="aplicarFiltros()"
                class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Fecha Hasta</label>
              <input 
                type="date" 
                [(ngModel)]="filtroFechaHasta"
                (ngModelChange)="aplicarFiltros()"
                class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200">
            </div>
          </div>
          
          <!-- Selector de registros por página -->
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <label class="text-sm font-medium text-gray-700">Registros por página:</label>
              <select 
                [(ngModel)]="registrosPorPagina"
                (ngModelChange)="cambiarRegistrosPorPagina()"
                class="px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200">
                <option *ngFor="let opcion of opcionesRegistrosPorPagina" [value]="opcion">
                  {{ opcion }}
                </option>
              </select>
            </div>
            <div class="text-sm text-gray-600">
              Página {{ paginaActual }} de {{ totalPaginas }}
            </div>
          </div>
        </div>

        <!-- Estado de Carga -->
        <div *ngIf="cargando" class="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-lg">
          <div class="flex items-center justify-center mb-6">
            <div class="relative">
              <svg class="animate-spin w-12 h-12 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-2">Cargando Auditoría...</h3>
          <p class="text-gray-600">Obteniendo registros de actualizaciones del servidor</p>
        </div>

        <!-- Estado de Error -->
        <div *ngIf="error && !cargando" class="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-lg">
          <div class="flex items-center justify-center mb-6">
            <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-2">Error al Cargar Datos</h3>
          <p class="text-gray-600 mb-6">{{ error }}</p>
          <button 
            (click)="cargarActualizaciones()"
            class="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center space-x-2 mx-auto">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            <span>Reintentar</span>
          </button>
        </div>

        <!-- Lista de Actualizaciones -->
        <div *ngIf="!cargando && !error && actualizacionesFiltradas.length > 0" class="space-y-4">
          <div *ngFor="let actualizacion of actualizacionesPaginadas; trackBy: trackByActualizacion" 
               class="bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md">
            
            <!-- Header de la actualización -->
            <div class="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4">
                  <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 class="text-lg font-semibold text-gray-900">Actualización de Asistencia</h3>
                    <p class="text-sm text-gray-600">ID: {{ actualizacion.id }}</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-sm font-medium text-gray-700">Fecha de actualización</p>
                  <p class="text-sm text-gray-600">{{ formatearFecha(actualizacion.fecha_actualizacion) }}</p>
                </div>
              </div>
            </div>

            <!-- Contenido de la actualización -->
            <div class="p-6">
              <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <!-- Información del Estudiante -->
                <div class="bg-gray-50 rounded-lg p-4">
                  <h4 class="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <svg class="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                    Estudiante
                  </h4>
                  <div class="space-y-2">
                    <div class="flex justify-between">
                      <span class="text-xs text-gray-600">Código:</span>
                      <span class="text-xs font-mono text-gray-900">{{ actualizacion.alumno.codigo }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-xs text-gray-600">Nombre:</span>
                      <span class="text-xs text-gray-900">{{ actualizacion.alumno.nombre }} {{ actualizacion.alumno.apellido }}</span>
                    </div>
                  </div>
                </div>

                <!-- Información de Asistencia -->
                <div class="bg-gray-50 rounded-lg p-4">
                  <h4 class="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <svg class="w-4 h-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    Acción Realizada
                  </h4>
                  <div class="space-y-2">
                    <div class="flex justify-between">
                      <span class="text-xs text-gray-600">Tipo de Acción:</span>
                      <span class="text-xs text-gray-900">{{ actualizacion.accion_amigable }}</span>
                    </div>
                  </div>
                </div>

                <!-- Información del Administrador -->
                <div class="bg-gray-50 rounded-lg p-4">
                  <h4 class="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <svg class="w-4 h-4 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                    Administrador
                  </h4>
                  <div class="space-y-2">
                    <div class="flex justify-between">
                      <span class="text-xs text-gray-600">Nombre:</span>
                      <span class="text-xs text-gray-900">{{ actualizacion.administrador.nombre }} {{ actualizacion.administrador.apellido }}</span>
                    </div>
                  </div>
                </div>
              </div>


              <!-- Motivo de la actualización -->
              <div class="mt-4 bg-gray-50 rounded-lg p-4">
                <h4 class="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <svg class="w-4 h-4 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path>
                  </svg>
                  Motivo
                </h4>
                <p class="text-sm text-gray-700">{{ actualizacion.motivo }}</p>
              </div>
            </div>
          </div>
          
          <!-- Controles de Paginación -->
          <div *ngIf="mostrarPaginacion" class="bg-white rounded-xl border border-gray-200 p-6 mt-6">
            <div class="flex items-center justify-between">
              <!-- Información de registros -->
              <div class="text-sm text-gray-600">
                Mostrando {{ rangoRegistros }} de {{ actualizacionesFiltradas.length }} registros
              </div>
              
              <!-- Controles de navegación -->
              <div class="flex items-center space-x-2">
                <!-- Botón Primera Página -->
                <button 
                  (click)="irAPagina(1)"
                  [disabled]="!mostrarPaginaAnterior"
                  class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"></path>
                  </svg>
                </button>
                
                <!-- Botón Página Anterior -->
                <button 
                  (click)="paginaAnterior()"
                  [disabled]="!mostrarPaginaAnterior"
                  class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                  </svg>
                </button>
                
                <!-- Números de página -->
                <div class="flex items-center space-x-1">
                  <button 
                    *ngFor="let pagina of paginasVisibles"
                    (click)="irAPagina(pagina)"
                    [class]="'px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ' + 
                      (pagina === paginaActual ? 
                        'bg-blue-600 text-white' : 
                        'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50')">
                    {{ pagina }}
                  </button>
                </div>
                
                <!-- Botón Página Siguiente -->
                <button 
                  (click)="paginaSiguiente()"
                  [disabled]="!mostrarPaginaSiguiente"
                  class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </button>
                
                <!-- Botón Última Página -->
                <button 
                  (click)="irAPagina(totalPaginas)"
                  [disabled]="!mostrarPaginaSiguiente"
                  class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Estado vacío -->
        <div *ngIf="!cargando && !error && actualizacionesFiltradas.length === 0" class="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-lg">
          <div class="flex items-center justify-center mb-6">
            <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
              </svg>
            </div>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-2">No hay registros encontrados</h3>
          <p class="text-gray-600 mb-6">
            {{ actualizaciones.length === 0 ? 
              'No hay actualizaciones de asistencia registradas aún' : 
              'No se encontraron actualizaciones con los filtros aplicados' }}
          </p>
          <div class="flex justify-center space-x-4">
            <button 
              *ngIf="actualizaciones.length > 0"
              (click)="limpiarFiltros()"
              class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center space-x-2">
              <span>Limpiar Filtros</span>
            </button>
            <button 
              (click)="cargarActualizaciones()"
              class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center space-x-2">
              <span>Actualizar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AuditAsistenciaComponent implements OnInit, OnDestroy {
  actualizaciones: ActualizacionAsistencia[] = [];
  actualizacionesFiltradas: ActualizacionAsistencia[] = [];
  actualizacionesPaginadas: ActualizacionAsistencia[] = [];
  cargando = false;
  error: string | null = null;
  totalRegistros = 0;

  // Filtros
  filtroCodigo = '';
  filtroEstado = '';
  filtroFechaDesde = '';
  filtroFechaHasta = '';

  // Paginación
  paginaActual = 1;
  registrosPorPagina = 10;
  totalPaginas = 0;
  opcionesRegistrosPorPagina = [5, 10, 20, 50];

  private destroy$ = new Subject<void>();

  constructor(
    private auditService: AuditAsistenciaService,
    private cdr: ChangeDetectorRef,
    private alertsService: AlertsService
  ) {}

  ngOnInit(): void {
    this.cargarActualizaciones();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarActualizaciones(): void {
    this.cargando = true;
    this.error = null;
    this.cdr.detectChanges();

    this.auditService.obtenerActualizacionesAsistencia()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: AuditAsistenciaResponse) => {
          this.actualizaciones = response.data;
          this.totalRegistros = response.count;
          this.aplicarFiltros();
          this.cargando = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.error = 'Error al cargar las actualizaciones de asistencia';
          this.cargando = false;
          this.cdr.detectChanges();
          this.alertsService.error('Error al cargar las actualizaciones de asistencia', 'Error de Carga');
        }
      });
  }

  aplicarFiltros(): void {
    this.actualizacionesFiltradas = this.actualizaciones.filter(actualizacion => {
      // Filtro por código del estudiante
      if (this.filtroCodigo && this.filtroCodigo.trim() !== '') {
        const codigoBusqueda = this.filtroCodigo.toLowerCase().trim();
        const codigoEstudiante = actualizacion.alumno.codigo.toLowerCase();
        if (!codigoEstudiante.includes(codigoBusqueda)) {
          return false;
        }
      }

      // Filtro por estado de asistencia
      if (this.filtroEstado && this.filtroEstado.trim() !== '') {
        if (actualizacion.accion_realizada !== this.filtroEstado) {
          return false;
        }
      }

      // Filtro por fecha desde (fecha de actualización)
      if (this.filtroFechaDesde && this.filtroFechaDesde.trim() !== '') {
        const fechaActualizacion = new Date(actualizacion.fecha_actualizacion);
        const fechaDesde = new Date(this.filtroFechaDesde);
        fechaDesde.setHours(0, 0, 0, 0); // Inicio del día
        if (fechaActualizacion < fechaDesde) {
          return false;
        }
      }

      // Filtro por fecha hasta (fecha de actualización)
      if (this.filtroFechaHasta && this.filtroFechaHasta.trim() !== '') {
        const fechaActualizacion = new Date(actualizacion.fecha_actualizacion);
        const fechaHasta = new Date(this.filtroFechaHasta);
        fechaHasta.setHours(23, 59, 59, 999); // Final del día
        if (fechaActualizacion > fechaHasta) {
          return false;
        }
      }

      return true;
    });

    // Aplicar paginación
    this.aplicarPaginacion();
  }

  aplicarPaginacion(): void {
    // Calcular total de páginas
    this.totalPaginas = Math.ceil(this.actualizacionesFiltradas.length / this.registrosPorPagina);
    
    // Asegurar que la página actual no exceda el total de páginas
    if (this.paginaActual > this.totalPaginas && this.totalPaginas > 0) {
      this.paginaActual = this.totalPaginas;
    }
    
    // Si no hay registros, ir a página 1
    if (this.actualizacionesFiltradas.length === 0) {
      this.paginaActual = 1;
    }

    // Calcular índices de inicio y fin
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    const fin = inicio + this.registrosPorPagina;

    // Obtener registros de la página actual
    this.actualizacionesPaginadas = this.actualizacionesFiltradas.slice(inicio, fin);
  }

  formatearFecha(fecha: string): string {
    return this.auditService.formatearFecha(fecha);
  }

  obtenerColorEstado(estado: string): string {
    return this.auditService.obtenerColorEstado(estado);
  }

  trackByActualizacion(index: number, actualizacion: ActualizacionAsistencia): string {
    return actualizacion.id;
  }

  limpiarFiltros(): void {
    this.filtroCodigo = '';
    this.filtroEstado = '';
    this.filtroFechaDesde = '';
    this.filtroFechaHasta = '';
    this.paginaActual = 1; // Resetear a la primera página
    this.aplicarFiltros();
  }

  // Métodos de paginación
  irAPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
      this.aplicarPaginacion();
    }
  }

  paginaAnterior(): void {
    if (this.paginaActual > 1) {
      this.paginaActual--;
      this.aplicarPaginacion();
    }
  }

  paginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas) {
      this.paginaActual++;
      this.aplicarPaginacion();
    }
  }

  cambiarRegistrosPorPagina(): void {
    this.paginaActual = 1; // Resetear a la primera página
    this.aplicarPaginacion();
  }

  // Getters para la paginación
  get mostrarPaginacion(): boolean {
    return this.totalPaginas > 1;
  }

  get mostrarPaginaAnterior(): boolean {
    return this.paginaActual > 1;
  }

  get mostrarPaginaSiguiente(): boolean {
    return this.paginaActual < this.totalPaginas;
  }

  get rangoRegistros(): string {
    if (this.actualizacionesFiltradas.length === 0) {
      return '0 - 0';
    }
    
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina + 1;
    const fin = Math.min(this.paginaActual * this.registrosPorPagina, this.actualizacionesFiltradas.length);
    
    return `${inicio} - ${fin}`;
  }

  get paginasVisibles(): number[] {
    const paginas: number[] = [];
    const maxPaginasVisibles = 5;
    
    let inicio = Math.max(1, this.paginaActual - Math.floor(maxPaginasVisibles / 2));
    let fin = Math.min(this.totalPaginas, inicio + maxPaginasVisibles - 1);
    
    // Ajustar inicio si estamos cerca del final
    if (fin - inicio + 1 < maxPaginasVisibles) {
      inicio = Math.max(1, fin - maxPaginasVisibles + 1);
    }
    
    for (let i = inicio; i <= fin; i++) {
      paginas.push(i);
    }
    
    return paginas;
  }
}
