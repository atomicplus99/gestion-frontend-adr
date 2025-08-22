import { Component, OnInit, OnDestroy, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil, finalize } from 'rxjs';

import { AlumnosEstadoService } from './services/AlumnoEstado.service';
import { AlumnosFiltroService } from './services/AlumnosFilter.service';
import { AlumnoEstado } from './models/AlumnoEstado.model';
import { DetalleAlumnoDialogComponent } from '../../../../shared/components/dialog/dialog.component';

@Component({
  selector: 'app-lista-alumnos-estado',
  standalone: true,
  templateUrl: './listAlumnos.component.html',
  imports: [CommonModule, HttpClientModule, FormsModule, MatDialogModule, MatTooltipModule],
  providers: [AlumnosEstadoService, AlumnosFiltroService],
  changeDetection: ChangeDetectionStrategy.OnPush, // ✅ Optimización de rendimiento
})
export class ListaAlumnosEstadoComponent implements OnInit, OnDestroy {
  Math = Math;
  datosOriginales: AlumnoEstado[] = [];
  alumnosFiltrados: AlumnoEstado[] = [];
  isLoading = true;

  // Filtros
  filterValue = '';
  filtroEstado = 'ACTIVO';
  filtroNivel = '';

  // Paginación y ordenamiento
  currentPage = 1;
  pageSize = 10;
  sortColumn = 'apellido';
  sortDirection: 'asc' | 'desc' = 'asc';
  
  // Contadores
  contadores = { activos: 0, inactivos: 0 };

  // Servicios
  private destroy$ = new Subject<void>();
  private dialog = inject(MatDialog);
  private alumnosService = inject(AlumnosEstadoService);
  private filtroService = inject(AlumnosFiltroService);
  private cdr = inject(ChangeDetectorRef); // ✅ Para forzar detección de cambios

  ngOnInit(): void { this.loadData(); }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  loadData(): void {
    this.isLoading = true;
    console.log('🚀 [LISTA-ALUMNOS] Iniciando carga de datos...');
    
    this.alumnosService.getAlumnosEstado()
      .pipe(
        takeUntil(this.destroy$), 
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck(); // ✅ Forzar detección al finalizar
        })
      )
      .subscribe({
        next: (data) => {
          console.log('✅ [LISTA-ALUMNOS] Datos recibidos:', data.length, 'alumnos');
          this.datosOriginales = data;
          this.actualizarContadores();
          this.filtroEstado = 'ACTIVO';
          this.applyFilter();
          this.cdr.markForCheck(); // ✅ Forzar detección después de procesar
          console.log('🎯 [LISTA-ALUMNOS] Datos procesados y filtros aplicados');
        },
        error: (err) => {
          console.error('❌ [LISTA-ALUMNOS] Error al cargar datos:', err);
          this.datosOriginales = [];
          this.alumnosFiltrados = [];
          this.cdr.markForCheck(); // ✅ Forzar detección en caso de error
        }
      });
  }

  actualizarContadores(): void {
    this.contadores = {
      activos: this.alumnosService.contarPorEstado(this.datosOriginales, 'ACTIVO'),
      inactivos: this.alumnosService.contarPorEstado(this.datosOriginales, 'INACTIVO')
    };
  }

  applyFilter(): void {
    console.log('🔍 [LISTA-ALUMNOS] Aplicando filtros...');
    console.log('📊 [LISTA-ALUMNOS] Filtros:', {
      busqueda: this.filterValue,
      estado: this.filtroEstado,
      nivel: this.filtroNivel
    });

    this.alumnosFiltrados = this.filtroService.aplicarFiltros(
      this.datosOriginales,
      { texto: this.filterValue, estado: this.filtroEstado, nivel: this.filtroNivel }
    );
    
    this.currentPage = 1;
    this.sortData(this.sortColumn, this.sortDirection);
    
    console.log('✅ [LISTA-ALUMNOS] Filtros aplicados:', this.alumnosFiltrados.length, 'resultados');
    this.cdr.markForCheck(); // ✅ Forzar detección después de filtrar
  }

  limpiarFiltros(): void {
    console.log('🧹 [LISTA-ALUMNOS] Limpiando filtros...');
    this.filterValue = ''; 
    this.filtroNivel = ''; 
    this.filtroEstado = 'ACTIVO'; 
    this.applyFilter();
    this.cdr.markForCheck(); // ✅ Forzar detección después de limpiar
  }

  openDetalle(row: AlumnoEstado): void {
    this.dialog.open(DetalleAlumnoDialogComponent, {
      width: '500px', data: row, autoFocus: false, panelClass: 'rounded-lg',
    });
  }

  refreshData(): void { 
    console.log('🔄 [LISTA-ALUMNOS] Refrescando datos...');
    this.loadData(); 
  }

  sortData(column: string, direction?: 'asc' | 'desc'): void {
    if (direction) {
      this.sortDirection = direction;
    } else {
      if (this.sortColumn === column) {
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortColumn = column;
        this.sortDirection = 'asc';
      }
    }
    
    console.log('📊 [LISTA-ALUMNOS] Ordenando por:', this.sortColumn, this.sortDirection);
    
    this.alumnosFiltrados = this.filtroService.ordenarAlumnos(
      this.alumnosFiltrados, this.sortColumn, this.sortDirection
    );
    
    this.cdr.markForCheck(); // ✅ Forzar detección después de ordenar
  }

  getAlumnosPaginados(): AlumnoEstado[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.alumnosFiltrados.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages(): number { return Math.ceil(this.alumnosFiltrados.length / this.pageSize); }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      console.log('📄 [LISTA-ALUMNOS] Cambiando a página:', page);
      this.cdr.markForCheck(); // ✅ Forzar detección al cambiar página
    }
  }

  changePageSize(size: number): void {
    const selectElement = event?.target as HTMLSelectElement;
    this.pageSize = size;
    this.currentPage = 1;
    console.log('📏 [LISTA-ALUMNOS] Cambiando tamaño de página a:', size);
    this.cdr.markForCheck(); // ✅ Forzar detección al cambiar tamaño
  }

  onFiltroChange(filters: any): void { 
    console.log('🔄 [LISTA-ALUMNOS] Cambio de filtros recibido:', filters);
    Object.assign(this, filters); 
    this.applyFilter(); 
  }
  
  onSortChange(event: any): void { 
    console.log('🔄 [LISTA-ALUMNOS] Cambio de orden recibido:', event);
    this.sortData(event.active, event.direction); 
  }

  // ✅ Método para forzar detección de cambios manualmente
  forceChangeDetection(): void {
    console.log('⚡ [LISTA-ALUMNOS] Forzando detección de cambios...');
    this.cdr.detectChanges(); // ✅ Detección inmediata
    this.cdr.markForCheck();  // ✅ Marcar para próxima detección
  }
}