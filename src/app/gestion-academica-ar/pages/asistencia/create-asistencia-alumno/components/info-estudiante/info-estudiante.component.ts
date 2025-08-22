// components/info-estudiante/info-estudiante.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { AlumnoInfoAsistenciaManual, AsistenciaExistenteManual } from '../../models/CreateAsistenciaManual.model';
import { RegistroAsistenciaServiceManual } from '../../services/register-asistencia.service';


@Component({
  selector: 'app-info-estudiante',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-lg shadow-md border border-blue-200 h-fit">
      <div class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-t-lg">
        <div class="flex items-center space-x-3">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
          </svg>
          <div>
            <h2 class="text-lg font-bold">Información del Estudiante</h2>
            <p class="text-blue-100 text-sm">Datos del estudiante encontrado</p>
          </div>
        </div>
      </div>
      
      <div class="p-6">
        <!-- Estudiante Encontrado -->
        <div *ngIf="alumnoEncontrado && !asistenciaExistente" class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm mb-6">
          <div class="flex items-center space-x-4 mb-6">
            <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
            </div>
            <div>
              <h3 class="text-2xl font-bold text-blue-800">Estudiante Encontrado</h3>
              <p class="text-blue-600 text-lg">Listo para registro de asistencia</p>
            </div>
          </div>
          
          <div class="bg-white rounded-xl p-6 border border-blue-200 space-y-4 shadow-sm">
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <span class="text-sm font-medium text-blue-700">Código</span>
                <p class="font-bold font-mono text-blue-900 text-lg">{{ alumnoEncontrado.codigo }}</p>
              </div>
              <div class="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <span class="text-sm font-medium text-blue-700">Fecha</span>
                <p class="font-bold text-blue-900 text-lg">{{ esFechaHoy ? 'Hoy' : fechaSeleccionada }}</p>
              </div>
            </div>
            
            <div class="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <span class="text-sm font-medium text-blue-700">Nombre Completo</span>
              <p class="font-bold text-blue-900 text-xl">{{ alumnoEncontrado.nombre }} {{ alumnoEncontrado.apellido }}</p>
            </div>
            
            <div class="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <span class="text-sm font-medium text-blue-700">Información Académica</span>
              <p class="font-bold text-blue-900 text-xl">{{ alumnoEncontrado.nivel }} - {{ alumnoEncontrado.grado }}° {{ alumnoEncontrado.seccion }}</p>
            </div>
          </div>
          
                     <div class="mt-6 p-4 bg-blue-100 rounded-xl border border-blue-300">
             <div class="flex items-center justify-center">
               <svg class="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
               </svg>
               <p class="text-blue-800 font-semibold text-center">
                 Sin asistencia registrada para {{ esFechaHoy ? 'hoy' : 'la fecha seleccionada' }}. Puede proceder con el registro manual.
               </p>
             </div>
           </div>
        </div>

      <!-- Estudiante con Asistencia -->
      <div *ngIf="asistenciaExistente" class="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl p-6 shadow-sm">
        <div class="flex items-center space-x-4 mb-6">
          <div class="w-16 h-16 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
          <div>
            <h3 class="text-2xl font-bold text-red-800">Registro Bloqueado</h3>
            <p class="text-red-600 text-lg">Asistencia ya registrada</p>
          </div>
        </div>
        
        <div class="bg-white rounded-xl p-6 border border-red-200 space-y-4 shadow-sm">
          <p class="text-red-700 font-semibold mb-4 text-lg">Ya tiene asistencia registrada para {{ esFechaHoy ? 'hoy' : fechaSeleccionada }}:</p>
          
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-red-50 rounded-lg p-4 border border-red-100">
              <span class="text-sm font-medium text-red-700">Hora Llegada</span>
              <p class="font-bold text-red-900 text-lg">{{ asistenciaExistente.hora_de_llegada }}</p>
            </div>
            <div class="bg-red-50 rounded-lg p-4 border border-red-100">
              <span class="text-sm font-medium text-red-700">Estado</span>
              <p class="font-bold" [ngClass]="getEstadoClass(asistenciaExistente.estado_asistencia)">
                {{ asistenciaExistente.estado_asistencia }}
              </p>
            </div>
          </div>
          
          <div *ngIf="asistenciaExistente.hora_salida" class="bg-red-50 rounded-lg p-4 border border-red-100">
            <span class="text-sm font-medium text-red-700">Hora Salida</span>
            <p class="font-bold text-red-900 text-lg">{{ asistenciaExistente.hora_salida }}</p>
          </div>
          
          <div class="bg-red-50 rounded-lg p-4 border border-red-100">
            <span class="text-sm font-medium text-red-700">Fecha</span>
            <p class="font-bold text-red-900 text-lg">{{ asistenciaExistente.fecha | date:'dd/MM/yyyy' }}</p>
          </div>
        </div>

                   <!-- Información sobre qué interfaz usar -->
           <div class="mt-6 p-4 rounded-xl" [ngClass]="getInfoClass(asistenciaExistente.estado_asistencia)">
             <div class="flex items-start" [ngClass]="getInfoTextClass(asistenciaExistente.estado_asistencia)">
               <svg class="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path *ngIf="asistenciaExistente.estado_asistencia === 'ANULADO'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                 <path *ngIf="asistenciaExistente.estado_asistencia === 'ANULADO'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                 <path *ngIf="asistenciaExistente.estado_asistencia === 'JUSTIFICADO'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                 <path *ngIf="asistenciaExistente.estado_asistencia === 'AUSENTE'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                 <path *ngIf="asistenciaExistente.estado_asistencia === 'PUNTUAL' || asistenciaExistente.estado_asistencia === 'TARDANZA'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
               </svg>
               <div class="text-sm font-medium">
                 <span *ngIf="asistenciaExistente.estado_asistencia === 'ANULADO'">
                   Para modificar: Use la interfaz de <strong>actualización de asistencias</strong>
                 </span>
                 <span *ngIf="asistenciaExistente.estado_asistencia === 'JUSTIFICADO'">
                   Para modificar: Use la interfaz de <strong>justificaciones</strong>
                 </span>
                 <span *ngIf="asistenciaExistente.estado_asistencia === 'AUSENTE'">
                   Para modificar: Use la interfaz de <strong>gestión de ausencias</strong>
                 </span>
                 <span *ngIf="asistenciaExistente.estado_asistencia === 'PUNTUAL' || asistenciaExistente.estado_asistencia === 'TARDANZA'">
                   Asistencia válida registrada. No se puede duplicar.
                 </span>
               </div>
             </div>
           </div>
      </div>

      <!-- Estado Inicial -->
      <div *ngIf="!alumnoEncontrado && !asistenciaExistente" class="bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
        <div class="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
          </svg>
        </div>
        <h3 class="text-2xl font-semibold text-gray-600 mb-3">Esperando Búsqueda</h3>
        <p class="text-gray-500 text-lg mb-2">Ingrese el código de un estudiante para comenzar</p>
        <p class="text-gray-400">Fecha: {{ esFechaHoy ? 'Hoy' : fechaSeleccionada }}</p>
      </div>
    </div>
  `
})
export class InfoEstudianteComponent implements OnInit, OnDestroy {
  alumnoEncontrado: AlumnoInfoAsistenciaManual | null = null;
  asistenciaExistente: AsistenciaExistenteManual | null = null;
  fechaSeleccionada: string = '';
  private destroy$ = new Subject<void>();

  constructor(private registroService: RegistroAsistenciaServiceManual) {}

  ngOnInit(): void {
    // Suscribirse a cambios en alumno encontrado
    this.registroService.alumnoEncontrado$
      .pipe(takeUntil(this.destroy$))
      .subscribe(alumno => {
        this.alumnoEncontrado = alumno;
      });

    // Suscribirse a cambios en asistencia existente
    this.registroService.asistenciaExistente$
      .pipe(takeUntil(this.destroy$))
      .subscribe(asistencia => {
        this.asistenciaExistente = asistencia;
      });

    // Suscribirse a cambios en fecha seleccionada
    this.registroService.fechaSeleccionada$
      .pipe(takeUntil(this.destroy$))
      .subscribe(fecha => {
        this.fechaSeleccionada = fecha;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get esFechaHoy(): boolean {
    return this.registroService.esFechaHoy(this.fechaSeleccionada);
  }

  getEstadoClass(estado: string): string {
    const baseClasses = {
      'PUNTUAL': 'text-green-700',
      'TARDANZA': 'text-yellow-700',
      'ANULADO': 'text-red-700',
      'JUSTIFICADO': 'text-blue-700',
      'AUSENTE': 'text-gray-700'
    };
    return baseClasses[estado as keyof typeof baseClasses] || 'text-gray-700';
  }

  getInfoClass(estado: string): string {
    const baseClasses = {
      'ANULADO': 'bg-red-100',
      'JUSTIFICADO': 'bg-blue-100',
      'AUSENTE': 'bg-gray-100',
      'PUNTUAL': 'bg-yellow-100',
      'TARDANZA': 'bg-yellow-100'
    };
    return baseClasses[estado as keyof typeof baseClasses] || 'bg-gray-100';
  }

  getInfoTextClass(estado: string): string {
    const baseClasses = {
      'ANULADO': 'text-red-800',
      'JUSTIFICADO': 'text-blue-800',
      'AUSENTE': 'text-gray-800',
      'PUNTUAL': 'text-yellow-800',
      'TARDANZA': 'text-yellow-800'
    };
    return baseClasses[estado as keyof typeof baseClasses] || 'text-gray-800';
  }
}