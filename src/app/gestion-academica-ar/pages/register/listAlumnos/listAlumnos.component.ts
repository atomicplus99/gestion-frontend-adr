import { Component, OnInit, OnDestroy, inject } from '@angular/core';
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

  ngOnInit(): void { this.loadData(); }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  loadData(): void {
    this.isLoading = true;
    this.alumnosService.getAlumnosEstado()
      .pipe(takeUntil(this.destroy$), finalize(() => this.isLoading = false))
      .subscribe({
        next: (data) => {
          this.datosOriginales = data;
          this.actualizarContadores();
          this.filtroEstado = 'ACTIVO';
          this.applyFilter();
        },
        error: (err) => {
          console.error('Error al cargar datos:', err);
          this.datosOriginales = [];
          this.alumnosFiltrados = [];
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
    this.alumnosFiltrados = this.filtroService.aplicarFiltros(
      this.datosOriginales,
      { texto: this.filterValue, estado: this.filtroEstado, nivel: this.filtroNivel }
    );
    this.currentPage = 1;
    this.sortData(this.sortColumn, this.sortDirection);
  }

  limpiarFiltros(): void {
    this.filterValue = ''; this.filtroNivel = ''; this.filtroEstado = 'ACTIVO'; this.applyFilter();
  }

  openDetalle(row: AlumnoEstado): void {
    this.dialog.open(DetalleAlumnoDialogComponent, {
      width: '500px', data: row, autoFocus: false, panelClass: 'rounded-lg',
    });
  }

  refreshData(): void { this.loadData(); }

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
    
    this.alumnosFiltrados = this.filtroService.ordenarAlumnos(
      this.alumnosFiltrados, this.sortColumn, this.sortDirection
    );
  }

  getAlumnosPaginados(): AlumnoEstado[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.alumnosFiltrados.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages(): number { return Math.ceil(this.alumnosFiltrados.length / this.pageSize); }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) this.currentPage = page;
  }

  changePageSize(size: number): void {
    const selectElement = event?.target as HTMLSelectElement;
    this.pageSize = size;
    this.currentPage = 1;
  }

  onFiltroChange(filters: any): void { Object.assign(this, filters); this.applyFilter(); }
  
  onSortChange(event: any): void { this.sortData(event.active, event.direction); }
}