import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil, finalize } from 'rxjs';
import { Apoderado, TipoRelacion } from '../models/ApoderadoDtos';
import { ApoderadoService } from '../apoderado.service';


@Component({
  selector: 'app-apoderado-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './list-apoderados.component.html'
})
export class ApoderadoListComponent implements OnInit, OnDestroy {
  private apoderadoService = inject(ApoderadoService);
  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  // Estado del componente
  apoderados: Apoderado[] = [];
  filteredApoderados: Apoderado[] = [];
  originalApoderados: Apoderado[] = [];
  loading = false;
  error: string | null = null;
  showAdvancedFilters = false;

  // Formularios
  searchForm!: FormGroup;
  advancedFiltersForm!: FormGroup;

  // Opciones para filtros
  tiposRelacion: { value: TipoRelacion | '', label: string }[] = [
    { value: '', label: 'Todos los tipos' },
    { value: 'PADRE', label: 'Padre' },
    { value: 'MADRE', label: 'Madre' },
    { value: 'ABUELO', label: 'Abuelo' },
    { value: 'ABUELA', label: 'Abuela' },
    { value: 'TIO', label: 'Tío' },
    { value: 'TIA', label: 'Tía' },
    { value: 'TUTOR', label: 'Tutor' },
    { value: 'OTRO', label: 'Otro' }
  ];

  estadoOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'true', label: 'Activos' },
    { value: 'false', label: 'Inactivos' }
  ];

  // Paginación
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 0;
  paginatedApoderados: Apoderado[] = [];

  // Apoderado seleccionado para mostrar detalles
  selectedApoderado: Apoderado | null = null;

  // Referencia a Math para usar en el template
  Math = Math;

  // Ordenamiento
  sortField: keyof Apoderado = 'nombre';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor() {
    this.initializeForms();
    this.setupFormSubscriptions();
  }

  ngOnInit(): void {
    this.loadApoderados();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForms(): void {
    this.searchForm = this.fb.group({
      nombre: [''],
      dni: ['']
    });

    this.advancedFiltersForm = this.fb.group({
      tipoRelacion: [''],
      estado: ['']
    });
  }

  private setupFormSubscriptions(): void {
    // Búsqueda por nombre con debounce
    this.searchForm.get('nombre')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.applyFilters();
      });

    // Búsqueda por DNI con debounce
    this.searchForm.get('dni')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.applyFilters();
      });

    // Filtros avanzados con debounce
    this.advancedFiltersForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.applyFilters();
      });
  }

  loadApoderados(): void {
    this.loading = true;
    this.error = null;

    this.apoderadoService.getAll()
      .pipe(
        finalize(() => this.loading = false),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: any) => {
          // Manejar diferentes tipos de respuesta del backend
          let apoderados: Apoderado[] = [];
          
          if (Array.isArray(response)) {
            // Si la respuesta es directamente un array
            apoderados = response;
          } else if (response && typeof response === 'object' && 'data' in response) {
            // Si la respuesta tiene estructura {success, message, data}
            apoderados = Array.isArray(response.data) ? response.data : [];
          }
          
          this.originalApoderados = apoderados;
          this.apoderados = [...apoderados];
          this.filteredApoderados = [...apoderados];
          this.updatePagination();
          this.updatePaginatedData();
        },
        error: (error) => {
          this.error = 'Error al cargar los apoderados';
          console.error('Error loading apoderados:', error);
        }
      });
  }

  searchByDni(): void {
    const dni = this.searchForm.get('dni')?.value?.trim();
    if (!dni) {
      this.loadApoderados(); // Recargar todos los apoderados si no hay DNI
      return;
    }

    this.loading = true;
    this.error = null;

    this.apoderadoService.getByDni(dni)
      .pipe(
        finalize(() => this.loading = false),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: any) => {
          let apoderados: Apoderado[] = [];
          
          if (response && typeof response === 'object' && 'data' in response) {
            // Si la respuesta tiene estructura {success, message, data}
            if (response.data) {
              apoderados = Array.isArray(response.data) ? response.data : [response.data];
            }
          } else if (response) {
            // Si la respuesta es directamente el apoderado
            apoderados = [response];
          }
          
          this.originalApoderados = apoderados;
          this.apoderados = [...apoderados];
          this.filteredApoderados = [...apoderados];
          this.currentPage = 1;
          this.updatePagination();
          this.updatePaginatedData();
        },
        error: (error) => {
          if (error.status === 404) {
            this.filteredApoderados = [];
            this.updatePagination();
            this.updatePaginatedData();
          } else {
            this.error = 'Error al buscar por DNI';
            console.error('Error searching by DNI:', error);
          }
        }
      });
  }

  applyFilters(): void {
    const nombre = this.searchForm.get('nombre')?.value?.toLowerCase() || '';
    const dni = this.searchForm.get('dni')?.value?.toLowerCase() || '';
    const filters = this.advancedFiltersForm.value;

    this.filteredApoderados = this.originalApoderados.filter(apoderado => {
      // Búsqueda por nombre
      if (nombre && !apoderado.nombre.toLowerCase().includes(nombre)) {
        return false;
      }

      // Búsqueda por DNI
      if (dni && !apoderado.dni?.toLowerCase().includes(dni)) {
        return false;
      }

      // Filtro por tipo de relación
      if (filters.tipoRelacion && apoderado.tipo_relacion !== filters.tipoRelacion) {
        return false;
      }

      // Filtro por estado
      if (filters.estado !== '' && apoderado.activo.toString() !== filters.estado) {
        return false;
      }

      return true;
    });

    this.currentPage = 1;
    this.updatePagination();
    this.updatePaginatedData();
  }

  sortBy(field: keyof Apoderado): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }

    this.filteredApoderados.sort((a, b) => {
      const aValue = a[field] || '';
      const bValue = b[field] || '';
      
      if (aValue < bValue) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });

    this.updatePaginatedData();
  }

  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  clearFilters(): void {
    this.searchForm.reset();
    this.advancedFiltersForm.reset();
    this.filteredApoderados = [...this.originalApoderados];
    this.currentPage = 1;
    this.updatePagination();
    this.updatePaginatedData();
  }

  // Métodos de paginación
  updatePagination(): void {
    this.totalItems = this.filteredApoderados.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
  }

  updatePaginatedData(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedApoderados = this.filteredApoderados.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedData();
    }
  }

  changeItemsPerPage(newSize: number): void {
    this.itemsPerPage = newSize;
    this.currentPage = 1;
    this.updatePagination();
    this.updatePaginatedData();
  }

  getPaginationArray(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  // Métodos utilitarios para el template
  getFullName(apoderado: Apoderado): string {
    return `${apoderado.nombre} ${apoderado.apellido || ''}`.trim();
  }

  getPupilosCount(apoderado: Apoderado): number {
    return apoderado.pupilos?.length || 0;
  }



  getTipoRelacionLabel(tipo: TipoRelacion): string {
    const found = this.tiposRelacion.find(t => t.value === tipo);
    return found?.label || tipo;
  }

  trackByApoderado(index: number, apoderado: Apoderado): string {
    return apoderado.id_apoderado;
  }

  refresh(): void {
    this.loadApoderados();
  }

  trackByApoderadoId(index: number, apoderado: Apoderado): string {
    return apoderado.id_apoderado;
  }

  trackByAlumnoId(index: number, alumno: any): string {
    return alumno.id_alumno;
  }

  /**
   * Selecciona un apoderado para mostrar sus detalles
   */
  selectApoderado(apoderado: Apoderado): void {
    this.selectedApoderado = apoderado;
  }

  /**
   * Obtiene las iniciales de un nombre y apellido
   */
  getInitials(nombre: string, apellido?: string): string {
    const firstInitial = nombre ? nombre.charAt(0).toUpperCase() : '';
    const lastInitial = apellido ? apellido.charAt(0).toUpperCase() : '';
    return firstInitial + lastInitial;
  }

  /**
   * Formatea una fecha para mostrar
   */
  formatDate(date: Date | string): string {
    if (!date) return 'No especificada';
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj.toLocaleDateString('es-PE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  }

  /**
   * Navega a la página anterior
   */
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedData();
    }
  }

  /**
   * Navega a la página siguiente
   */
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedData();
    }
  }
}