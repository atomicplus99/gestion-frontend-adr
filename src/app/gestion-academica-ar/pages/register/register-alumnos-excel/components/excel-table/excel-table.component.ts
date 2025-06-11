import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlumnoModuleExcel } from '../../models/alumno-excel.model';
import { ExcelUtils } from '../../utils/excel.utils';


@Component({
  selector: 'app-excel-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section *ngIf="alumnos.length > 0" class="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-6">
      <div class="mb-4">
        <h2 class="text-xl font-semibold text-gray-800 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          Alumnos Importados
        </h2>
        <p class="text-sm text-gray-500">Lista de alumnos importados desde el archivo Excel ({{alumnos.length}}).</p>
      </div>

      <div class="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 mb-4">
        <button (click)="onExportExcel()" [disabled]="alumnos.length === 0"
          class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Exportar a Excel
        </button>
        <button (click)="onClearTable()" [disabled]="alumnos.length === 0"
          class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Limpiar Tabla
        </button>
      </div>

      <div class="overflow-x-auto rounded-lg shadow ring-1 ring-gray-200 border border-gray-200">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
              <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
              <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Apellido</th>
              <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DNI</th>
              <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nivel</th>
              <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grado</th>
              <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sección</th>
              <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr *ngFor="let alumno of paginatedAlumnos; let i = index" 
                class="hover:bg-gray-50 transition-colors" 
                [ngClass]="{'bg-white': i % 2 === 0, 'bg-gray-50': i % 2 !== 0}">
              <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                {{ (currentPage - 1) * itemsPerPage + i + 1 }}
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-sm font-mono text-blue-600">{{ alumno.codigo }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{{ alumno.nombre }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{{ alumno.apellido }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{{ alumno.dni_alumno }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-sm">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" 
                      [ngClass]="obtenerColorPorNivel(alumno.nivel)">
                  {{ alumno.nivel }}
                </span>
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-center">{{ alumno.grado }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-center">{{ alumno.seccion }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-sm">
                <div *ngIf="alumno.usuario" class="flex items-center space-x-1">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span class="text-green-600">{{ alumno.usuario.nombre_usuario }}</span>
                </div>
                <div *ngIf="!alumno.usuario" class="flex items-center space-x-1 text-red-500 text-xs">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Sin usuario</span>
                </div>
              </td>
            </tr>
            <tr *ngIf="alumnos.length === 0">
              <td colspan="9" class="px-4 py-8 text-center text-gray-500">
                No hay alumnos importados para mostrar
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="mt-4 flex flex-col sm:flex-row justify-between items-center bg-gray-50 px-4 py-3 rounded-lg">
        <div class="flex items-center mb-2 sm:mb-0">
          <label for="itemsPerPage" class="text-sm text-gray-600 mr-2">Mostrar:</label>
          <select [(ngModel)]="itemsPerPage" (change)="onItemsPerPageChange()" id="itemsPerPage"
            class="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm py-1">
            <option [value]="10">10</option>
            <option [value]="25">25</option>
            <option [value]="50">50</option>
            <option [value]="100">100</option>
          </select>
          <span class="text-sm text-gray-600 ml-2">registros por página</span>
        </div>
        
        <div class="flex items-center space-x-1">
          <span class="text-sm text-gray-600">
            Página {{ currentPage }} de {{ totalPages }} (Total: {{ alumnos.length }} registros)
          </span>
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExcelTableComponent {
  @Input() alumnos: AlumnoModuleExcel[] = [];
  @Input() currentPage: number = 1;
  @Input() itemsPerPage: number = 10;
  
  @Output() exportExcel = new EventEmitter<AlumnoModuleExcel[]>();
  @Output() clearTable = new EventEmitter<void>();
  @Output() pageChange = new EventEmitter<{page: number, itemsPerPage: number}>();

  get paginatedAlumnos(): AlumnoModuleExcel[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.alumnos.slice(startIndex, endIndex);
  }

  get totalPages(): number {
    return Math.ceil(this.alumnos.length / this.itemsPerPage);
  }

  obtenerColorPorNivel(nivel: string): string {
    return ExcelUtils.obtenerColorPorNivel(nivel as any);
  }

  onExportExcel(): void {
    this.exportExcel.emit(this.alumnos);
  }

  onClearTable(): void {
    this.clearTable.emit();
  }

  onItemsPerPageChange(): void {
    this.pageChange.emit({
      page: 1,
      itemsPerPage: this.itemsPerPage
    });
  }
}