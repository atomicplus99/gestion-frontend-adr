import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExcelWidgetData } from '../../models/excel-import.model';


@Component({
  selector: 'app-excel-widgets',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
      <!-- Alumnos Importados -->
      <div class="bg-white rounded-lg shadow-sm p-4 flex flex-col items-center">
        <div class="rounded-full bg-blue-100 p-3 mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h3 class="text-sm font-medium text-gray-500">Alumnos Importados</h3>
        <p class="text-2xl font-bold text-gray-800 my-1">{{ data.importadosHoy }}</p>
        <div class="text-xs text-gray-500">En esta operación</div>
      </div>

      <!-- Registros con Errores -->
      <div class="bg-white rounded-lg shadow-sm p-4 flex flex-col items-center">
        <div class="rounded-full bg-yellow-100 p-3 mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 class="text-sm font-medium text-gray-500">Registros con Errores</h3>
        <p class="text-2xl font-bold text-gray-800 my-1">{{ data.registrosConError }}</p>
        <div class="text-xs text-gray-500 flex items-center justify-center">
          <svg *ngIf="data.registrosConError > 0" xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span *ngIf="data.registrosConError > 0">Requiere atención</span>
          <span *ngIf="data.registrosConError === 0">No hay errores</span>
        </div>
      </div>

      <!-- Usuarios creados -->
      <div class="bg-white rounded-lg shadow-sm p-4 flex flex-col items-center">
        <div class="rounded-full bg-green-100 p-3 mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>
        <h3 class="text-sm font-medium text-gray-500">Usuarios Creados</h3>
        <p class="text-2xl font-bold text-gray-800 my-1">{{ data.usuariosCreados }}</p>
        <div class="w-full bg-gray-200 rounded-full h-1.5 mt-2">
          <div class="h-1.5 rounded-full bg-green-500" [style.width.%]="data.porcentajeUsuariosCreados"></div>
        </div>
        <div class="w-full text-xs text-right mt-1 text-gray-500">
          {{ data.porcentajeUsuariosCreados }}% del total
        </div>
      </div>

      <!-- Tiempo de proceso -->
      <div class="bg-white rounded-lg shadow-sm p-4 flex flex-col items-center">
        <div class="rounded-full bg-purple-100 p-3 mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 class="text-sm font-medium text-gray-500">Tiempo de Proceso</h3>
        <p class="text-2xl font-bold text-gray-800 my-1">{{ data.tiempoProceso }}s</p>
        <div class="text-xs text-gray-500">
          Duración de la importación
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExcelWidgetsComponent {
  @Input() data: ExcelWidgetData = {
    importadosHoy: 0,
    registrosConError: 0,
    usuariosCreados: 0,
    porcentajeUsuariosCreados: 0,
    tiempoProceso: 0
  };
}