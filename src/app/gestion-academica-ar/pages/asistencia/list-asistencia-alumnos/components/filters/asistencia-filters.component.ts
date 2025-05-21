import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AsistenciaFilters } from '../../models/ListAsistencia.model';
import { FilterChipComponent } from '../shared/filter-chip/filter-chip.component';


@Component({
  selector: 'app-asistencia-filters',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule, 
    FormsModule,
    FilterChipComponent
  ],
  templateUrl: './asistencia-filters.component.html',
  styleUrls: ['./asistencia-filters.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AsistenciaFiltersComponent implements OnInit {
  @Input() turnos: string[] = [];
  @Input() niveles: string[] = [];
  @Input() grados: number[] = [];
  @Input() secciones: string[] = [];
  @Input() activeFilters: string[] = [];
  @Input() isFiltersPanelExpanded = false;

  @Output() filtersChange = new EventEmitter<AsistenciaFilters>();
  @Output() filterRemove = new EventEmitter<string>();
  @Output() clearFilters = new EventEmitter<void>();
  @Output() toggleFilters = new EventEmitter<void>();
  @Output() estadoFilterChange = new EventEmitter<string>();
  
  filterForm!: FormGroup;
  filterValue = '';
  
  constructor(private fb: FormBuilder) {}
  
  ngOnInit(): void {
    this.setupFilterForm();
  }
  
  private setupFilterForm(): void {
    const today = new Date();
    const formattedDate = this.formatDateForInput(today);

    this.filterForm = this.fb.group({
      fechaInicio: [formattedDate],
      fechaFin: [formattedDate],
      estado: ['TODOS'],
      turno: ['TODOS'],
      nivel: ['TODOS'],
      grado: ['TODOS'],
      seccion: ['TODOS'],
      searchText: [''],
      dni: ['']
    });

    // Subscribirse a cambios en el formulario
    this.filterForm.valueChanges.subscribe(values => {
      this.filtersChange.emit(values);
    });
  }
  
  toggleFiltersVisibility(): void {
    this.toggleFilters.emit();
  }
  
  applyFilter(): void {
    this.filtersChange.emit(this.filterForm.value);
  }
  
  onClearFilters(): void {
    this.clearFilters.emit();
  }
  
  onRemoveFilter(filter: string): void {
    this.filterRemove.emit(filter);
  }
  
  setEstadoFilter(estado: string): void {
    this.filterForm.patchValue({ estado });
    // Emitir el estado como string para el evento estadoFilterChange
    this.estadoFilterChange.emit(estado);
  }
  
  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}