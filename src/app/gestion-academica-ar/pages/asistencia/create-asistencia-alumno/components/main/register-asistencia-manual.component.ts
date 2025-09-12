// registro-asistencia.component.ts - Componente principal modularizado
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BuscarEstudianteComponent } from '../buscar-estudiante/buscar-estudiante.component';
import { InfoEstudianteComponent } from '../info-estudiante/info-estudiante.component';
import { FormularioRegistroComponent } from '../formulario-registro/formulario-registro.component';


@Component({
  selector: 'app-registro-asistencia',
  standalone: true,
  imports: [
    CommonModule,
    BuscarEstudianteComponent,
    InfoEstudianteComponent,
    FormularioRegistroComponent
  ],
  template: `
    <div class="min-h-screen bg-gray-50 w-full">
      <div class="w-full px-6 py-8">
        
        <!-- Header Principal -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-lg mb-4 shadow-sm">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
          </div>
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Registro de Asistencia Manual</h1>
          <p class="text-lg text-gray-600">Registro manual de asistencia de estudiantes</p>
        </div>

        <!-- Layout Principal -->
        <div class="grid grid-cols-12 gap-6 w-full">
          
          <!-- COLUMNA 1: Búsqueda (3 columnas) -->
          <div class="col-span-12 lg:col-span-3">
            <app-buscar-estudiante></app-buscar-estudiante>
          </div>

          <!-- COLUMNA 2: Información del Estudiante (4 columnas) -->
          <div class="col-span-12 lg:col-span-4">
            <app-info-estudiante></app-info-estudiante>
          </div>

          <!-- COLUMNA 3: Formulario de Registro (5 columnas) -->
          <div class="col-span-12 lg:col-span-5">
            <app-formulario-registro></app-formulario-registro>
          </div>
        </div>
      </div>
    </div>
  `
})
export class RegistroAsistenciaComponentManual {
  // El componente principal ahora es solo un contenedor
  // Toda la lógica está distribuida en los componentes hijos
}