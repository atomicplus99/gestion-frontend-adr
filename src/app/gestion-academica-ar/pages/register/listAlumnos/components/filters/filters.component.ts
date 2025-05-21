import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-filtros-alumnos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filters.component.html',
})
export class FiltrosAlumnosComponent {
  @Input() filterValue = '';
  @Input() filtroEstado = '';
  @Input() filtroNivel = '';
  @Input() totalRegistros = 0;
  @Input() registrosFiltrados = 0;
  @Input() contadores = {
    activos: 0,
    inactivos: 0
  };

  @Output() aplicarFiltro = new EventEmitter<void>();
  @Output() limpiarFiltros = new EventEmitter<void>();
  @Output() filtroChange = new EventEmitter<{
    filterValue: string;
    filtroEstado: string;
    filtroNivel: string;
  }>();

  onApplyFilter(): void {
    console.log("Botón aplicar filtro clickeado");
    this.aplicarFiltro.emit();
  }

  onFilterValueChange(): void {
    console.log("Valor del filtro de texto cambiado:", this.filterValue);
    this.filtroChange.emit({
      filterValue: this.filterValue,
      filtroEstado: this.filtroEstado,
      filtroNivel: this.filtroNivel
    });
  }

  onFiltroChange(): void {
    console.log("Cambio en filtros dropdown:", {
      estado: this.filtroEstado,
      nivel: this.filtroNivel
    });
    
    this.filtroChange.emit({
      filterValue: this.filterValue,
      filtroEstado: this.filtroEstado,
      filtroNivel: this.filtroNivel
    });
  }

  onLimpiarFiltros(): void {
    console.log("Limpiando filtros");
    this.filterValue = '';
    this.filtroEstado = '';
    this.filtroNivel = '';
    this.limpiarFiltros.emit();
  }

  hayFiltrosActivos(): boolean {
    return this.filterValue !== '' || this.filtroEstado !== '' || this.filtroNivel !== '';
  }
}