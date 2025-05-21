import { Component, Input, ViewChild, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatTableModule,
  MatTableDataSource,
} from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface AlumnoEstado {
  codigo: string;
  dni_alumno: string;
  nombre: string;
  apellido: string;
  direccion: string;
  nivel: string;
  grado: number;
  seccion: string;
  turno: { turno: string };
  usuario: { nombre_usuario: string; rol_usuario: string };
  estado_actual: {
    estado: string;
    observacion: string;
    fecha_actualizacion: string;
  };
  codigo_qr?: string;
  fecha_nacimiento?: string;
}

@Component({
  selector: 'app-tabla-alumnos',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatTooltipModule
  ],
  template: `
    <!-- SECCIÓN: ESTADO DE CARGA -->
    <div *ngIf="isLoading" class="flex justify-center items-center py-20">
      <div class="loader">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
      </div>
    </div>

    <!-- SECCIÓN: SIN DATOS -->
    <div *ngIf="!isLoading && dataSource.data.length === 0" class="bg-white rounded-xl shadow-md p-10 text-center border border-gray-100">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h3 class="text-xl font-semibold text-gray-700 mb-2">No se encontraron alumnos</h3>
      <p class="text-gray-500 mb-6">No hay registros disponibles en la base de datos</p>
      <button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all" (click)="onRefresh()">
        Intentar nuevamente
      </button>
    </div>

    <!-- SECCIÓN: TABLA DE DATOS -->
    <div *ngIf="!isLoading && dataSource.data.length > 0" class="overflow-hidden bg-white rounded-xl shadow-md border border-gray-100">
      <div class="overflow-x-auto">
        <table
          mat-table
          [dataSource]="dataSource"
          matSort
          class="min-w-full divide-y divide-gray-200"
          (matSortChange)="sortData($event)"
        >
          <!-- COLUMNAS DE LA TABLA -->
          
          <!-- Código -->
          <ng-container matColumnDef="codigo">
            <th mat-header-cell *matHeaderCellDef mat-sort-header class="px-4 py-3 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Código
            </th>
            <td mat-cell *matCellDef="let a" class="px-4 py-3 whitespace-nowrap">
              <div class="text-sm font-medium text-gray-900">{{ a.codigo }}</div>
            </td>
          </ng-container>

          <!-- DNI -->
          <ng-container matColumnDef="dni_alumno">
            <th mat-header-cell *matHeaderCellDef mat-sort-header class="px-4 py-3 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              DNI
            </th>
            <td mat-cell *matCellDef="let a" class="px-4 py-3 whitespace-nowrap">
              <div class="text-sm text-gray-900">{{ a.dni_alumno }}</div>
            </td>
          </ng-container>

          <!-- Nombre -->
          <ng-container matColumnDef="nombre">
            <th mat-header-cell *matHeaderCellDef mat-sort-header class="px-4 py-3 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Estudiante
            </th>
            <td mat-cell *matCellDef="let a" class="px-4 py-3">
              <div class="flex items-center">
                <div class="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 mr-3 text-sm font-medium">
                  {{ a.nombre?.charAt(0) || '?' }}{{ a.apellido?.charAt(0) || '?' }}
                </div>
                <div>
                  <div class="text-sm font-medium text-gray-900">{{ a.nombre }}</div>
                  <div class="text-sm text-gray-500">{{ a.apellido }}</div>
                </div>
              </div>
            </td>
          </ng-container>

          <!-- Apellido (oculto) -->
          <ng-container matColumnDef="apellido">
            <th mat-header-cell *matHeaderCellDef mat-sort-header class="hidden">Apellido</th>
            <td mat-cell *matCellDef="let a" class="hidden">{{ a.apellido }}</td>
          </ng-container>

          <!-- Nivel -->
          <ng-container matColumnDef="nivel">
            <th mat-header-cell *matHeaderCellDef mat-sort-header class="px-4 py-3 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Nivel
            </th>
            <td mat-cell *matCellDef="let a" class="px-4 py-3">
              <div class="text-sm font-medium text-gray-900">{{ a.nivel }}</div>
              <div class="text-xs text-gray-500">{{ a.grado }}° · Sección {{ a.seccion }}</div>
            </td>
          </ng-container>

          <!-- Grado (oculto) -->
          <ng-container matColumnDef="grado">
            <th mat-header-cell *matHeaderCellDef mat-sort-header class="hidden">Grado</th>
            <td mat-cell *matCellDef="let a" class="hidden">{{ a.grado }}</td>
          </ng-container>

          <!-- Sección (oculto) -->
          <ng-container matColumnDef="seccion">
            <th mat-header-cell *matHeaderCellDef mat-sort-header class="hidden">Sección</th>
            <td mat-cell *matCellDef="let a" class="hidden">{{ a.seccion }}</td>
          </ng-container>

          <!-- Turno -->
          <ng-container matColumnDef="turno">
            <th mat-header-cell *matHeaderCellDef mat-sort-header class="px-4 py-3 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Turno
            </th>
            <td mat-cell *matCellDef="let a" class="px-4 py-3 whitespace-nowrap">
              <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full"
                    [ngClass]="{
                      'bg-yellow-100 text-yellow-800': a.turno?.turno === 'Mañana',
                      'bg-blue-100 text-blue-800': a.turno?.turno === 'Tarde',
                      'bg-purple-100 text-purple-800': a.turno?.turno === 'Noche',
                      'bg-gray-100 text-gray-800': !a.turno?.turno || !['Mañana', 'Tarde', 'Noche'].includes(a.turno.turno)
                    }">
                {{ a.turno?.turno || 'Sin turno' }}
              </span>
            </td>
          </ng-container>

          <!-- Usuario -->
          <ng-container matColumnDef="usuario">
            <th mat-header-cell *matHeaderCellDef mat-sort-header class="px-4 py-3 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Usuario
            </th>
            <td mat-cell *matCellDef="let a" class="px-4 py-3 whitespace-nowrap">
              <div class="text-sm text-gray-900">{{ a.usuario?.nombre_usuario || 'Sin usuario' }}</div>
            </td>
          </ng-container>

          <!-- Estado -->
          <ng-container matColumnDef="estado">
            <th mat-header-cell *matHeaderCellDef mat-sort-header class="px-4 py-3 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Estado
            </th>
            <td mat-cell *matCellDef="let a" class="px-4 py-3 whitespace-nowrap">
              <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full"
                    [ngClass]="{
                      'bg-green-100 text-green-800': a.estado_actual?.estado === 'Activo',
                      'bg-red-100 text-red-800': a.estado_actual?.estado === 'Inactivo',
                      'bg-yellow-100 text-yellow-800': a.estado_actual?.estado === 'Pendiente',
                      'bg-blue-100 text-blue-800': a.estado_actual?.estado === 'Egresado',
                      'bg-gray-100 text-gray-800': a.estado_actual?.estado && !['Activo', 'Inactivo', 'Pendiente', 'Egresado'].includes(a.estado_actual.estado)
                    }">
                {{ a.estado_actual?.estado || 'Sin estado' }}
              </span>
            </td>
          </ng-container>

          <!-- Fecha de actualización -->
          <ng-container matColumnDef="fecha_actualizacion">
            <th mat-header-cell *matHeaderCellDef mat-sort-header class="px-4 py-3 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Actualizado
            </th>
            <td mat-cell *matCellDef="let a" class="px-4 py-3 whitespace-nowrap">
              <div class="text-sm text-gray-500">{{ a.estado_actual?.fecha_actualizacion | date:'dd MMM yyyy' }}</div>
              <div class="text-xs text-gray-400">{{ a.estado_actual?.fecha_actualizacion | date:'HH:mm' }}</div>
            </td>
          </ng-container>

          <!-- Acciones -->
          <ng-container matColumnDef="expand">
            <th mat-header-cell *matHeaderCellDef class="px-4 py-3 bg-gray-50 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Acciones
            </th>
            <td mat-cell *matCellDef="let a" class="px-4 py-3 text-right">
              <button 
                class="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                (click)="onVerDetalle(a); $event.stopPropagation()"
                matTooltip="Ver detalles del alumno"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </td>
          </ng-container>

          <!-- FILAS Y CABECERAS -->
          <tr
            mat-header-row
            *matHeaderRowDef="displayedColumnsVisible; sticky: true"
            class="bg-gray-50"
          ></tr>
          <tr
            mat-row
            *matRowDef="let row; columns: displayedColumnsVisible"
            class="hover:bg-blue-50 transition-colors cursor-pointer border-t border-gray-100"
            (click)="onVerDetalle(row)"
          ></tr>
          
          <!-- FILA SIN RESULTADOS -->
          <tr class="mat-row" *matNoDataRow>
            <td class="px-4 py-6 text-center text-gray-500" [attr.colspan]="displayedColumnsVisible.length">
              <div class="flex flex-col items-center py-5">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p class="text-lg font-medium text-gray-500">No se encontraron alumnos</p>
                <p class="text-sm text-gray-400 mb-4">No hay coincidencias con la búsqueda: "{{ filterValue }}"</p>
                <button
                  class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
                  (click)="onClearFilter()"
                >
                  Limpiar filtros
                </button>
              </div>
            </td>
          </tr>
        </table>
      </div>

      <!-- Paginador mejorado -->
      <div class="border-t border-gray-200">
        <mat-paginator
          [pageSizeOptions]="[10, 25, 50, 100]"
          showFirstLastButtons
          class="bg-white"
          (page)="onPaginatorEvent($event)"
        ></mat-paginator>
      </div>
    </div>
  `,
  styles: [`
    .loader {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
    }
    
    .dot {
      width: 12px;
      height: 12px;
      background-color: #3b82f6;
      border-radius: 50%;
      opacity: 0.3;
      animation: pulse 1.5s ease-in-out infinite;
    }
    
    .dot:nth-child(2) {
      animation-delay: 0.3s;
    }
    
    .dot:nth-child(3) {
      animation-delay: 0.6s;
    }
    
    @keyframes pulse {
      0%, 100% {
        opacity: 0.3;
        transform: scale(0.8);
      }
      50% {
        opacity: 1;
        transform: scale(1.2);
      }
    }
  `]
})
export class TablaAlumnosComponent {
  @Input() dataSource: MatTableDataSource<AlumnoEstado> = new MatTableDataSource<AlumnoEstado>([]);
  @Input() isLoading = false;
  @Input() filterValue = '';
  @Input() displayedColumns: string[] = [];
  @Input() displayedColumnsVisible: string[] = [];
  
  @Output() verDetalle = new EventEmitter<AlumnoEstado>();
  @Output() refreshData = new EventEmitter<void>();
  @Output() clearFilter = new EventEmitter<void>();
  @Output() pageChange = new EventEmitter<any>();
  @Output() sortChange = new EventEmitter<any>();
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
  
  onVerDetalle(alumno: AlumnoEstado): void {
    this.verDetalle.emit(alumno);
  }
  
  onRefresh(): void {
    this.refreshData.emit();
  }
  
  onClearFilter(): void {
    this.clearFilter.emit();
  }
  
  onPaginatorEvent(event: any): void {
    this.pageChange.emit(event);
  }
  
  sortData(event: any): void {
    this.sortChange.emit(event);
  }
}