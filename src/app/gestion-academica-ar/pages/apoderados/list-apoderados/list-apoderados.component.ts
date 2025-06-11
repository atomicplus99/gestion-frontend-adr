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
      searchTerm: ['']
    });

    this.advancedFiltersForm = this.fb.group({
      dni: [''],
      nombre: [''],
      apellido: [''],
      email: [''],
      telefono: [''],
      tipoRelacion: [''],
      activo: [''],
      fechaDesde: [''],
      fechaHasta: [''],
      conPupilos: ['']
    });
  }

  private setupFormSubscriptions(): void {
    // Búsqueda general con debounce
    this.searchForm.get('searchTerm')?.valueChanges
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
        next: (apoderados) => {
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
    const dni = this.advancedFiltersForm.get('dni')?.value?.trim();
    if (!dni) {
      this.applyFilters();
      return;
    }

    this.loading = true;
    this.apoderadoService.searchByDni(dni)
      .pipe(
        finalize(() => this.loading = false),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (apoderado) => {
          this.filteredApoderados = [apoderado];
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
    const searchTerm = this.searchForm.get('searchTerm')?.value?.toLowerCase() || '';
    const filters = this.advancedFiltersForm.value;

    this.filteredApoderados = this.originalApoderados.filter(apoderado => {
      // Búsqueda general
      if (searchTerm) {
        const matchesSearch = 
          apoderado.nombre.toLowerCase().includes(searchTerm) ||
          apoderado.apellido?.toLowerCase().includes(searchTerm) ||
          apoderado.dni?.includes(searchTerm) ||
          apoderado.email?.toLowerCase().includes(searchTerm) ||
          apoderado.telefono?.includes(searchTerm);
        
        if (!matchesSearch) return false;
      }

      // Filtros específicos
      if (filters.nombre && !apoderado.nombre.toLowerCase().includes(filters.nombre.toLowerCase())) {
        return false;
      }

      if (filters.apellido && !apoderado.apellido?.toLowerCase().includes(filters.apellido.toLowerCase())) {
        return false;
      }

      if (filters.dni && !apoderado.dni?.includes(filters.dni)) {
        return false;
      }

      if (filters.email && !apoderado.email?.toLowerCase().includes(filters.email.toLowerCase())) {
        return false;
      }

      if (filters.telefono && !apoderado.telefono?.includes(filters.telefono)) {
        return false;
      }

      if (filters.tipoRelacion && apoderado.tipo_relacion !== filters.tipoRelacion) {
        return false;
      }

      if (filters.activo !== '' && apoderado.activo !== (filters.activo === 'true')) {
        return false;
      }

      if (filters.conPupilos !== '') {
        const tienePupilos = apoderado.pupilos && apoderado.pupilos.length > 0;
        if (filters.conPupilos === 'true' && !tienePupilos) return false;
        if (filters.conPupilos === 'false' && tienePupilos) return false;
      }

      // Filtros de fecha
      if (filters.fechaDesde) {
        const fechaCreacion = new Date(apoderado.fecha_creacion);
        const fechaDesde = new Date(filters.fechaDesde);
        if (fechaCreacion < fechaDesde) return false;
      }

      if (filters.fechaHasta) {
        const fechaCreacion = new Date(apoderado.fecha_creacion);
        const fechaHasta = new Date(filters.fechaHasta);
        fechaHasta.setHours(23, 59, 59, 999);
        if (fechaCreacion > fechaHasta) return false;
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

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-PE');
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
}