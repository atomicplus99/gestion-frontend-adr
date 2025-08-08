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
    <!-- Estudiante Encontrado -->
    <div *ngIf="alumnoEncontrado && !asistenciaExistente" class="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 shadow-xl mb-6">
      <div class="flex items-center space-x-4 mb-4">
        <div class="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
          <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
          </svg>
        </div>
        <h3 class="text-xl font-bold text-green-800">✓ Estudiante Localizado</h3>
      </div>
      
      <div class="bg-white rounded-xl p-4 border border-green-200 space-y-3">
        <div class="flex justify-between items-center py-2 border-b border-gray-100">
          <span class="text-sm font-medium text-gray-600">Código:</span>
          <span class="font-bold font-mono text-gray-900">{{ alumnoEncontrado.codigo }}</span>
        </div>
        <div class="flex justify-between items-center py-2 border-b border-gray-100">
          <span class="text-sm font-medium text-gray-600">Nombre:</span>
          <span class="font-bold text-gray-900 text-right">{{ alumnoEncontrado.nombre }} {{ alumnoEncontrado.apellido }}</span>
        </div>
        <div class="flex justify-between items-center py-2 border-b border-gray-100">
          <span class="text-sm font-medium text-gray-600">Turno:</span>
          <span class="font-bold text-gray-900">{{ alumnoEncontrado.turno.turno }}</span>
        </div>
        <div class="flex justify-between items-center py-2 border-b border-gray-100">
          <span class="text-sm font-medium text-gray-600">Horario:</span>
          <span class="font-bold text-gray-900">{{ alumnoEncontrado.turno.hora_inicio }} - {{ alumnoEncontrado.turno.hora_fin }}</span>
        </div>
        <div class="flex justify-between items-center py-2">
          <span class="text-sm font-medium text-gray-600">Fecha registro:</span>
          <span class="font-bold text-blue-700">{{ esFechaHoy ? 'Hoy' : fechaSeleccionada }}</span>
        </div>
      </div>
      
      <div class="mt-4 p-3 bg-green-100 rounded-lg">
        <p class="text-sm text-green-800 font-medium">
          ✅ Sin asistencia registrada para {{ esFechaHoy ? 'hoy' : 'la fecha seleccionada' }}. Puede proceder con el registro manual.
        </p>
      </div>
    </div>

    <!-- Estudiante con Asistencia -->
    <div *ngIf="asistenciaExistente" class="bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200 rounded-2xl p-6 shadow-xl mb-6">
      <div class="flex items-center space-x-4 mb-4">
        <div class="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
          <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
          </svg>
        </div>
        <h3 class="text-xl font-bold text-red-800">⚠️ Registro Bloqueado</h3>
      </div>
      
      <div class="bg-white rounded-xl p-4 border border-red-200 space-y-3">
        <p class="text-red-700 font-medium mb-3">Ya tiene asistencia registrada para {{ esFechaHoy ? 'hoy' : fechaSeleccionada }}:</p>
        <div class="flex justify-between items-center py-2 border-b border-gray-100">
          <span class="text-sm font-medium text-gray-600">Hora llegada:</span>
          <span class="font-bold text-gray-900">{{ asistenciaExistente.hora_de_llegada }}</span>
        </div>
        <div class="flex justify-between items-center py-2 border-b border-gray-100">
          <span class="text-sm font-medium text-gray-600">Estado:</span>
          <span class="font-bold" [ngClass]="getEstadoClass(asistenciaExistente.estado_asistencia)">
            {{ asistenciaExistente.estado_asistencia }}
          </span>
        </div>
        <div *ngIf="asistenciaExistente.hora_salida" class="flex justify-between items-center py-2 border-b border-gray-100">
          <span class="text-sm font-medium text-gray-600">Hora salida:</span>
          <span class="font-bold text-gray-900">{{ asistenciaExistente.hora_salida }}</span>
        </div>
        <div class="flex justify-between items-center py-2">
          <span class="text-sm font-medium text-gray-600">Fecha:</span>
          <span class="font-bold text-gray-900">{{ asistenciaExistente.fecha | date:'dd/MM/yyyy' }}</span>
        </div>
      </div>

      <!-- Información sobre qué interfaz usar -->
      <div class="mt-4 p-3 rounded-lg" [ngClass]="getInfoClass(asistenciaExistente.estado_asistencia)">
        <p class="text-sm font-medium" [ngClass]="getInfoTextClass(asistenciaExistente.estado_asistencia)">
          <span *ngIf="asistenciaExistente.estado_asistencia === 'ANULADO'">
            🔧 Para modificar: Use la interfaz de <strong>actualización de asistencias</strong>
          </span>
          <span *ngIf="asistenciaExistente.estado_asistencia === 'JUSTIFICADO'">
            📝 Para modificar: Use la interfaz de <strong>justificaciones</strong>
          </span>
          <span *ngIf="asistenciaExistente.estado_asistencia === 'AUSENTE'">
            📊 Para modificar: Use la interfaz de <strong>gestión de ausencias</strong>
          </span>
          <span *ngIf="asistenciaExistente.estado_asistencia === 'PUNTUAL' || asistenciaExistente.estado_asistencia === 'TARDANZA'">
            ⚠️ Asistencia válida registrada. No se puede duplicar.
          </span>
        </p>
      </div>
    </div>

    <!-- Estado Inicial -->
    <div *ngIf="!alumnoEncontrado && !asistenciaExistente" class="bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center">
      <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
      </svg>
      <h3 class="text-lg font-semibold text-gray-600 mb-2">Esperando Búsqueda</h3>
      <p class="text-gray-500">Ingrese el código de un estudiante para comenzar</p>
      <p class="text-sm text-gray-400 mt-2">Fecha: {{ esFechaHoy ? 'Hoy' : fechaSeleccionada }}</p>
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