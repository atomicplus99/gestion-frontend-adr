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
    <div class="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div class="max-w-7xl mx-auto">
        
        <!-- Header Principal -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl mb-4 shadow-lg">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
          </div>
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Registro de Asistencia</h1>
          <p class="text-lg text-gray-600">Sistema de gestión manual para estudiantes</p>
        </div>

        <!-- Layout Principal: 3 Columnas -->
        <div class="grid grid-cols-12 gap-6 h-full">
          
          <!-- COLUMNA 1: Búsqueda (4 columnas) -->
          <div class="col-span-12 lg:col-span-4">
            <app-buscar-estudiante></app-buscar-estudiante>
          </div>

          <!-- COLUMNA 2: Información del Estudiante (4 columnas) -->
          <div class="col-span-12 lg:col-span-4">
            <app-info-estudiante></app-info-estudiante>
          </div>

          <!-- COLUMNA 3: Formulario de Registro (4 columnas) -->
          <div class="col-span-12 lg:col-span-4">
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