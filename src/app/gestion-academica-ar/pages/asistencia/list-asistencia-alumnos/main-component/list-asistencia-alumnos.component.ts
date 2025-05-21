import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, ViewEncapsulation } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup } from '@angular/forms';

import { forkJoin, Subscription } from 'rxjs';
import { catchError, map, debounceTime, distinctUntilChanged } from 'rxjs/operators';

// Interfaces
import { AsistenciaResponse, ViewMode, AsistenciaRowList, AsistenciaFilters } from '../models/ListAsistencia.model';
import { environment } from '../../../../../../environments/environment';

// Component imports


import { LoadingIndicatorComponent } from '../components/shared/loading-indicator/loading-indicator.component';
import { EstadoBadgeComponent } from '../components/shared/estado-badge/estado-badge.component';
import { FilterChipComponent } from '../components/shared/filter-chip/filter-chip.component';
import { AsistenciaTableComponent } from '../components/table-view/asistencia-table.component';
import { AsistenciaFiltersComponent } from '../components/filters/asistencia-filters.component';
import { AsistenciaHeaderComponent } from '../components/header/asistencia-header.component';
import { AsistenciaPaginationComponent } from '../components/pagination/asistencia-pagination.component';
import { AsistenciaEmptyStateComponent } from '../components/empty-state/asistencia-empty.component';
import { AsistenciaCardComponent } from '../components/card-view/asistencia-card.component';

@Component({
  selector: 'app-list-asistencia-alumnos',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    AsistenciaTableComponent,
    AsistenciaFiltersComponent,
    AsistenciaHeaderComponent,
    AsistenciaPaginationComponent,
    AsistenciaEmptyStateComponent,
    AsistenciaCardComponent,
    LoadingIndicatorComponent,
    // EstadoBadgeComponent,
    // FilterChipComponent
  ],
  templateUrl: './list-asistencia-alumnos.component.html',
  styleUrls: ['./list-asistencia-alumnos.component.css'],
  providers: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.Emulated
})
export class ListAsistenciaAlumnosComponent implements OnInit, OnDestroy {
  // Datos de la tabla
  dataSource: AsistenciaRowList[] = [];
  filteredData: AsistenciaRowList[] = [];
  originalData: AsistenciaRowList[] = [];
  originalResponse: AsistenciaResponse[] = [];

  // Estado de la UI
  isLoading = true;
  activeFilters: string[] = [];
  isFiltersPanelExpanded = false;
  currentView: ViewMode = 'table';
  
  // Notificaciones
  showNotification = false;
  notificationMessage = '';
  notificationType: 'success' | 'error' = 'success';
  
  // Opciones de filtros
  turnos: string[] = [];
  niveles: string[] = [];
  secciones: string[] = [];
  grados: number[] = [];
  filterForm!: FormGroup;
  filterValue = '';

  // Paginación y ordenamiento
  currentPage = 1;
  pageSize = 10;
  sortColumn = 'codigo';
  sortDirection: 'asc' | 'desc' = 'asc';
  
  // Manejo de suscripciones
  private subscriptions: Subscription[] = [];

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    this.setupFilterForm();
    this.loadData();
  }

  ngOnDestroy(): void {
    // Limpiar todas las suscripciones
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // Configuración del formulario de filtros
  setupFilterForm(): void {
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

    // Suscripción a cambios en el campo de búsqueda
    const searchSub = this.filterForm.get('searchText')!.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(value => {
        this.filterValue = value;
        this.applyFilter();
      });

    this.subscriptions.push(searchSub);

    // Suscripción a cambios en el campo DNI
    const dniSub = this.filterForm.get('dni')!.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.applyFilter();
      });

    this.subscriptions.push(dniSub);
  }

  // Cargar datos de asistencia
  loadData(): void {
    this.isLoading = true;
    
    const sub = this.http.get<AsistenciaResponse[]>(`${environment.apiUrl}/asistencia/list`)
      .pipe(
        map(response => {
          console.log('Datos recibidos:', response);
          return response;
        }),
        catchError(err => {
          console.error('Error al cargar datos:', err);
          this.isLoading = false;
          this.cdr.markForCheck();
          this.showErrorNotification('Error al cargar los datos. Intente nuevamente.');
          throw err;
        })
      )
      .subscribe({
        next: (response) => {
          this.originalResponse = response;
          this.processAsistenciasData(response);
          this.extractFilterOptions();
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });

    this.subscriptions.push(sub);
  }

  // Procesar datos de asistencia
  processAsistenciasData(data: AsistenciaResponse[]): void {
    if (!Array.isArray(data)) {
      console.error('Se esperaba un array:', data);
      return;
    }

    console.log('Processing', data.length, 'records');

    this.originalData = data.map(item => {
      // Safely access nested properties with null checks
      const alumno = item.alumno || {};
      const turno = alumno.turno || {};
      
      // Extract values with proper type handling
      const codigo = alumno.codigo || '';
      const dni = alumno.dni_alumno || '';
      
      console.log(`Item: codigo=${codigo}, dni=${dni}`); // Debug log
      
      // Ensure estado_asistencia is one of the accepted values or default to 'AUSENTE'
      let estado: 'PUNTUAL' | 'TARDANZA' | 'AUSENTE';
      if (item.estado_asistencia === 'PUNTUAL' || item.estado_asistencia === 'TARDANZA' || 
          item.estado_asistencia === 'AUSENTE') {
        estado = item.estado_asistencia as 'PUNTUAL' | 'TARDANZA' | 'AUSENTE';
      } else {
        estado = 'AUSENTE'; // Default value if invalid
      }

      return {
        id: item.id_asistencia,
        codigo: codigo,
        dni: dni,
        nombre: alumno.nombre || '',
        apellido: alumno.apellido || '',
        nivel: alumno.nivel || '',
        grado: alumno.grado || 0,
        seccion: alumno.seccion || '',
        turno: turno.turno || '—',
        horaLlegada: item.hora_de_llegada || '',
        horaSalida: item.hora_salida,
        estado: estado,
        fecha: item.fecha || new Date().toISOString(),
        observaciones: item.observaciones || ''
      };
    });

    this.filteredData = [...this.originalData];
    this.sortData(this.sortColumn);
    this.updateDataSource();
  }

  // Extraer opciones de filtros de los datos
  extractFilterOptions(): void {
    const turnosSet = new Set<string>();
    const nivelesSet = new Set<string>();
    const seccionesSet = new Set<string>();
    const gradosSet = new Set<number>();

    // Extract unique values from response data
    this.originalResponse.forEach(item => {
      if (item.alumno?.turno?.turno) turnosSet.add(item.alumno.turno.turno);
      if (item.alumno?.nivel) nivelesSet.add(item.alumno.nivel);
      if (item.alumno?.seccion) seccionesSet.add(item.alumno.seccion);
      if (item.alumno?.grado) gradosSet.add(item.alumno.grado);
    });

    this.turnos = ['TODOS', ...Array.from(turnosSet)];
    this.niveles = ['TODOS', ...Array.from(nivelesSet)];
    this.secciones = ['TODOS', ...Array.from(seccionesSet)];
    this.grados = [...Array.from(gradosSet)].sort((a, b) => a - b);
  }

  // Métodos de filtrado
  applyFilter(): void {
    console.log('Applying filters with values:', this.filterForm.value);
    
    const filters = this.filterForm.value;
    let filteredData = [...this.originalData];

    // Aplicar filtros según los criterios seleccionados
    if (filters.fechaInicio && filters.fechaFin) {
      try {
        const startDate = new Date(filters.fechaInicio);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(filters.fechaFin);
        endDate.setHours(23, 59, 59, 999);

        filteredData = filteredData.filter(item => {
          try {
            const itemDate = new Date(item.fecha);
            return itemDate >= startDate && itemDate <= endDate;
          } catch (e) {
            console.error('Error parsing date:', item.fecha);
            return false;
          }
        });
      } catch (e) {
        console.error('Error setting up date filters:', e);
      }
    }

    // Estado filter
    if (filters.estado && filters.estado !== 'TODOS') {
      filteredData = filteredData.filter(item => 
        item.estado && item.estado.toUpperCase() === filters.estado.toUpperCase()
      );
    }

    // Turno filter
    if (filters.turno && filters.turno !== 'TODOS') {
      filteredData = filteredData.filter(item => 
        item.turno && item.turno.toLowerCase() === filters.turno.toLowerCase()
      );
    }

    // Nivel filter
    if (filters.nivel && filters.nivel !== 'TODOS') {
      filteredData = filteredData.filter(item => 
        item.nivel && item.nivel.toUpperCase() === filters.nivel.toUpperCase()
      );
    }

    // Grado filter
    if (filters.grado && filters.grado !== 'TODOS') {
      filteredData = filteredData.filter(item => {
        return item.grado !== undefined && 
               String(item.grado).trim() === String(filters.grado).trim();
      });
    }

    // Seccion filter
    if (filters.seccion && filters.seccion !== 'TODOS') {
      filteredData = filteredData.filter(item => 
        item.seccion && item.seccion.toUpperCase() === filters.seccion.toUpperCase()
      );
    }

    // DNI filter - FIX HERE
    if (filters.dni && filters.dni.trim() !== '') {
      const dniStr = filters.dni.toLowerCase().trim();
      console.log('Filtering by DNI:', dniStr);
      
      filteredData = filteredData.filter(item => {
        if (!item.dni) return false;
        const match = item.dni.toLowerCase().includes(dniStr);
        console.log(`DNI comparison: "${item.dni}" includes "${dniStr}"? ${match}`);
        return match;
      });
    }

    // SearchText filter - FIX HERE
    if (filters.searchText && filters.searchText.trim() !== '') {
      const searchStr = filters.searchText.toLowerCase().trim();
      console.log('Filtering by search text:', searchStr);
      
      filteredData = filteredData.filter(item => {
        // For debugging
        if (item.codigo) {
          console.log(`Comparing codigo: "${item.codigo}" with search: "${searchStr}"`);
        }
        
        return (
          (item.codigo && item.codigo.toLowerCase().includes(searchStr)) ||
          (item.dni && item.dni.toLowerCase().includes(searchStr)) ||
          (item.nombre && item.nombre.toLowerCase().includes(searchStr)) ||
          (item.apellido && item.apellido.toLowerCase().includes(searchStr)) ||
          (item.turno && item.turno.toLowerCase().includes(searchStr)) ||
          (item.estado && item.estado.toLowerCase().includes(searchStr)) ||
          (item.seccion && item.seccion.toLowerCase().includes(searchStr)) ||
          (item.nivel && item.nivel.toLowerCase().includes(searchStr)) ||
          (item.grado !== undefined && String(item.grado).includes(searchStr))
        );
      });
    }

    console.log(`Filter applied: ${filteredData.length} out of ${this.originalData.length} records shown`);
    
    this.filteredData = filteredData;
    this.currentPage = 1;
    this.updateActiveFilters();
    this.updateDataSource();
    this.cdr.markForCheck();
  }

  // Handle filter changes from AsistenciaFiltersComponent
  onFiltersChange(filters: AsistenciaFilters): void {
    console.log('Received filters from child component:', filters);
    this.filterForm.patchValue(filters, { emitEvent: false });
    this.applyFilter();
  }

  clearFilters(): void {
    const today = new Date();
    const formattedDate = this.formatDateForInput(today);

    this.filterForm.reset({
      fechaInicio: formattedDate,
      fechaFin: formattedDate,
      estado: 'TODOS',
      turno: 'TODOS',
      nivel: 'TODOS',
      grado: 'TODOS',
      seccion: 'TODOS',
      searchText: '',
      dni: ''
    });

    this.filterValue = '';
    this.filteredData = [...this.originalData];
    this.activeFilters = [];
    this.updateDataSource();
    this.cdr.markForCheck();
  }

  setEstadoFilter(estado: string): void {
    this.filterForm.patchValue({ estado });
    this.applyFilter();
  }

  removeFilter(filter: string): void {
    const filterParts = filter.split(': ');
    if (filterParts.length === 2) {
      const filterName = filterParts[0].toLowerCase();
      const today = new Date();
      const formattedDate = this.formatDateForInput(today);
      
      switch(filterName) {
        case 'desde':
          this.filterForm.patchValue({ fechaInicio: formattedDate });
          break;
        case 'hasta':
          this.filterForm.patchValue({ fechaFin: formattedDate });
          break;
        case 'estado':
          this.filterForm.patchValue({ estado: 'TODOS' });
          break;
        case 'turno':
          this.filterForm.patchValue({ turno: 'TODOS' });
          break;
        case 'nivel':
          this.filterForm.patchValue({ nivel: 'TODOS' });
          break;
        case 'grado':
          this.filterForm.patchValue({ grado: 'TODOS' });
          break;
        case 'sección':
          this.filterForm.patchValue({ seccion: 'TODOS' });
          break;
        case 'dni':
          this.filterForm.patchValue({ dni: '' });
          break;
        case 'texto':
          this.filterForm.patchValue({ searchText: '' });
          this.filterValue = '';
          break;
      }
      
      this.applyFilter();
    }
  }

  updateActiveFilters(): void {
    this.activeFilters = [];
    const filters = this.filterForm.value;

    if (filters.fechaInicio) {
      this.activeFilters.push(`Desde: ${this.formatDate(filters.fechaInicio)}`);
    }

    if (filters.fechaFin) {
      this.activeFilters.push(`Hasta: ${this.formatDate(filters.fechaFin)}`);
    }

    if (filters.estado && filters.estado !== 'TODOS') {
      this.activeFilters.push(`Estado: ${filters.estado}`);
    }

    if (filters.turno && filters.turno !== 'TODOS') {
      this.activeFilters.push(`Turno: ${filters.turno}`);
    }

    if (filters.nivel && filters.nivel !== 'TODOS') {
      this.activeFilters.push(`Nivel: ${filters.nivel}`);
    }

    if (filters.grado && filters.grado !== 'TODOS') {
      this.activeFilters.push(`Grado: ${filters.grado}`);
    }

    if (filters.seccion && filters.seccion !== 'TODOS') {
      this.activeFilters.push(`Sección: ${filters.seccion}`);
    }

    if (filters.dni) {
      this.activeFilters.push(`DNI: ${filters.dni}`);
    }

    if (filters.searchText) {
      this.activeFilters.push(`Texto: "${filters.searchText}"`);
    }
  }

  // Métodos de paginación
  updateDataSource(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = Math.min(startIndex + this.pageSize, this.filteredData.length);
    this.dataSource = this.filteredData.slice(startIndex, endIndex);
    console.log(`Pagination: showing ${startIndex+1}-${endIndex} of ${this.filteredData.length}`);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
      this.updateDataSource();
      this.cdr.markForCheck();
    }
  }

  getTotalPages(): number {
    return Math.ceil(this.filteredData.length / this.pageSize);
  }

  get totalPages(): number {
    return this.getTotalPages();
  }

  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    const currentPage = this.currentPage;
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = startPage + maxVisiblePages - 1;
    
    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  }

  // Métodos de ordenamiento
  sortData(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.filteredData.sort((a: any, b: any) => {
      const valueA = a[column];
      const valueB = b[column];
      
      if (column === 'fecha') {
        return this.sortDirection === 'asc'
          ? new Date(valueA).getTime() - new Date(valueB).getTime()
          : new Date(valueB).getTime() - new Date(valueA).getTime();
      }

      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return this.sortDirection === 'asc'
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }

      return this.sortDirection === 'asc'
        ? (valueA || 0) - (valueB || 0)
        : (valueB || 0) - (valueA || 0);
    });

    this.updateDataSource();
    this.cdr.markForCheck();
  }

  // Acciones
  refreshData(): void {
    this.loadData();
    this.showSuccessNotification('Datos actualizados correctamente');
  }

  exportToCSV(): void {
    const headers = ['Código', 'DNI', 'Nombre', 'Apellido', 'Nivel', 'Grado', 'Sección', 'Turno', 
                     'Hora de Llegada', 'Hora de Salida', 'Estado', 'Fecha', 'Observaciones'];
    
    const csvRows = [
      headers.join(','),
      ...this.filteredData.map(row => [
        `"${row.codigo || ''}"`,
        `"${row.dni || ''}"`,
        `"${row.nombre || ''}"`,
        `"${row.apellido || ''}"`,
        `"${row.nivel || ''}"`,
        row.grado || 0,
        `"${row.seccion || ''}"`,
        `"${row.turno || '—'}"`,
        `"${row.horaLlegada || ''}"`,
        `"${row.horaSalida || '—'}"`,
        `"${row.estado || ''}"`,
        `"${this.formatDate(row.fecha)}"`,
        `"${row.observaciones || ''}"`,
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `asistencias_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    this.showSuccessNotification('Archivo CSV exportado correctamente');
  }

  onMarkAttendance(row: AsistenciaRowList, status: 'PUNTUAL' | 'TARDANZA' | 'AUSENTE'): void {
    this.http.put(`${environment.apiUrl}/asistencia/${row.id}`, {
      estado_asistencia: status
    }).subscribe({
      next: () => {
        const index = this.originalData.findIndex(item => item.id === row.id);
        if (index !== -1) {
          this.originalData[index].estado = status;
          
          const respIndex = this.originalResponse.findIndex(item => item.id_asistencia === row.id);
          if (respIndex !== -1) {
            this.originalResponse[respIndex].estado_asistencia = status;
          }
        }
        
        this.applyFilter();
        this.showSuccessNotification(`Asistencia actualizada a ${status}`);
      },
      error: (err) => {
        console.error('Error al actualizar asistencia:', err);
        this.showErrorNotification('Error al actualizar la asistencia');
      }
    });
  }

  onMarkExit(row: AsistenciaRowList): void {
    const now = new Date();
    const timeString = now.toTimeString().slice(0, 8); // Format HH:MM:SS
    
    this.http.put(`${environment.apiUrl}/asistencia/${row.id}`, {
      hora_salida: timeString
    }).subscribe({
      next: () => {
        const index = this.originalData.findIndex(item => item.id === row.id);
        if (index !== -1) {
          this.originalData[index].horaSalida = timeString;
          
          const respIndex = this.originalResponse.findIndex(item => item.id_asistencia === row.id);
          if (respIndex !== -1) {
            this.originalResponse[respIndex].hora_salida = timeString;
          }
        }
        
        this.applyFilter();
        this.showSuccessNotification('Salida registrada correctamente');
      },
      error: (err) => {
        console.error('Error al registrar salida:', err);
        this.showErrorNotification('Error al registrar la salida');
      }
    });
  }

  onAddObservation(row: AsistenciaRowList): void {
    const observation = prompt('Ingrese observación:', row.observaciones || '');
    
    if (observation !== null) {
      this.http.put(`${environment.apiUrl}/asistencia/${row.id}`, {
        observaciones: observation
      }).subscribe({
        next: () => {
          const index = this.originalData.findIndex(item => item.id === row.id);
          if (index !== -1) {
            this.originalData[index].observaciones = observation;
            
            // Actualizar también en la respuesta original
            const respIndex = this.originalResponse.findIndex(item => item.id_asistencia === row.id);
            if (respIndex !== -1) {
              (this.originalResponse[respIndex] as any).observaciones = observation;
            }
          }
          
          this.applyFilter();
          this.showSuccessNotification('Observación actualizada correctamente');
        },
        error: (err) => {
          console.error('Error al agregar observación:', err);
          this.showErrorNotification('Error al actualizar la observación');
        }
      });
    }
  }

  markAllPresent(): void {
    if (confirm('¿Está seguro de marcar todos los alumnos visibles como PUNTUAL?')) {
      const requests = this.dataSource.map(row => {
        return this.http.put(`${environment.apiUrl}/asistencia/${row.id}`, {
          estado_asistencia: 'PUNTUAL'
        });
      });

      forkJoin(requests).subscribe({
        next: () => {
          this.dataSource.forEach(row => {
            const index = this.originalData.findIndex(item => item.id === row.id);
            if (index !== -1) {
              this.originalData[index].estado = 'PUNTUAL';
              
              const respIndex = this.originalResponse.findIndex(item => item.id_asistencia === row.id);
              if (respIndex !== -1) {
                this.originalResponse[respIndex].estado_asistencia = 'PUNTUAL';
              }
            }
          });
          
          this.applyFilter();
          this.showSuccessNotification('Todos los alumnos visibles marcados como PUNTUAL');
        },
        error: (err) => {
          console.error('Error al marcar asistencias:', err);
          this.showErrorNotification('Error al marcar asistencias');
        }
      });
    }
  }

  // Métodos de UI
  setView(view: ViewMode): void {
    this.currentView = view;
    this.cdr.markForCheck();
  }

  toggleFiltersVisibility(): void {
    this.isFiltersPanelExpanded = !this.isFiltersPanelExpanded;
    this.cdr.markForCheck();
  }

  // Handle events from child components
  onAttendanceStatusChange(event: {row: AsistenciaRowList, status: 'PUNTUAL' | 'TARDANZA' | 'AUSENTE'}): void {
    this.onMarkAttendance(event.row, event.status);
  }

  // Notificaciones
  showSuccessNotification(message: string): void {
    this.notificationMessage = message;
    this.notificationType = 'success';
    this.showNotification = true;
    
    setTimeout(() => {
      this.showNotification = false;
      this.cdr.markForCheck();
    }, 3000);
    
    this.cdr.markForCheck();
  }

  showErrorNotification(message: string): void {
    this.notificationMessage = message;
    this.notificationType = 'error';
    this.showNotification = true;
    
    setTimeout(() => {
      this.showNotification = false;
      this.cdr.markForCheck();
    }, 4000);
    
    this.cdr.markForCheck();
  }

  // Utilidades
  formatDate(date: string | Date): string {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return this.datePipe.transform(dateObj, 'dd/MM/yyyy') || '';
  }

  formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}