// assign-students.component.ts
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApoderadoAsignService } from './services/apoderado-asigne.service';
import { AlumnoAsignService } from './services/alumno-asign.service';
import { Alumno, Apoderado } from './models/AsignarAlumnoApoderado.model';

@Component({
  selector: 'app-assign-students',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container mx-auto px-4 py-8 max-w-7xl">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Asignar Alumnos a Apoderado</h1>
        <p class="text-gray-600">Selecciona un apoderado y gestiona los alumnos asignados</p>
      </div>

      <!-- Selección de Apoderado -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">1. Seleccionar Apoderado</h2>
        
        <!-- Buscador de Apoderados -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">Buscar Apoderado</label>
          <div class="relative">
            <input
              type="text"
              [ngModel]="searchApoderado()"
              (ngModelChange)="searchApoderado.set($event)"
              placeholder="Buscar por nombre, apellido o DNI..."
              class="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <i class="fas fa-search absolute left-3 top-3 text-gray-400"></i>
          </div>
          @if (searchApoderado() && filteredApoderados().length === 0) {
            <p class="text-sm text-gray-500 mt-2">No se encontraron apoderados con ese criterio de búsqueda</p>
          }
        </div>

        <!-- Grid de Apoderados -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (apoderado of filteredApoderados(); track apoderado.id_apoderado) {
            <div 
              (click)="selectApoderado(apoderado)"
              [class]="getApoderadoCardClass(apoderado)"
              class="cursor-pointer transition-all duration-200">
              <div class="p-4">
                <h3 class="font-semibold text-gray-900">
                  {{ apoderado.nombre }} {{ apoderado.apellido || '' }}
                </h3>
                <p class="text-sm text-gray-600 mt-1">
                  <span class="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                    {{ apoderado.tipo_relacion }}
                  </span>
                </p>
                <div class="mt-2 text-sm text-gray-500">
                  <p><i class="fas fa-id-card mr-1"></i>DNI: {{ apoderado.dni || 'No registrado' }}</p>
                  <p><i class="fas fa-phone mr-1"></i>{{ apoderado.telefono || 'Sin teléfono' }}</p>
                </div>
                @if (apoderado.pupilos && apoderado.pupilos.length > 0) {
                  <div class="mt-2">
                    <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      {{ apoderado.pupilos.length }} alumno(s) asignado(s)
                    </span>
                  </div>
                }
              </div>
            </div>
          } @empty {
            <div class="col-span-full text-center py-8">
              <i class="fas fa-user-slash text-4xl text-gray-300 mb-4"></i>
              <p class="text-gray-500">No hay apoderados disponibles</p>
            </div>
          }
        </div>

        @if (selectedApoderado()) {
          <div class="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <i class="fas fa-user-check text-blue-600 mr-2"></i>
                <span class="font-medium text-blue-900">
                  Apoderado seleccionado: {{ selectedApoderado()!.nombre }} {{ selectedApoderado()!.apellido || '' }}
                </span>
              </div>
              @if (initiallyAssignedStudents().length > 0) {
                <span class="text-sm text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
                  {{ initiallyAssignedStudents().length }} estudiante(s) ya asignado(s)
                </span>
              }
            </div>
          </div>
        }
      </div>

      <!-- Lista de Alumnos -->
      @if (selectedApoderado()) {
        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-semibold text-gray-800">2. Gestionar Alumnos</h2>
            <div class="flex items-center space-x-4">
              <div class="text-sm text-gray-600 space-x-4">
                <span class="bg-green-100 text-green-800 px-2 py-1 rounded">
                  {{ studentsToAdd().length }} para asignar
                </span>
                <span class="bg-red-100 text-red-800 px-2 py-1 rounded">
                  {{ studentsToRemove().length }} para remover
                </span>
                <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {{ selectedStudents().length }} total seleccionados
                </span>
              </div>
              @if (hasChanges()) {
                <button
                  (click)="resetChanges()"
                  class="text-sm text-gray-600 hover:text-gray-800">
                  Resetear cambios
                </button>
              }
            </div>
          </div>

          <!-- Resumen de cambios -->
          @if (hasChanges()) {
            <div class="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div class="flex items-start">
                <i class="fas fa-exclamation-triangle text-yellow-600 mr-2 mt-0.5"></i>
                <div class="flex-1">
                  <h4 class="text-sm font-medium text-yellow-800 mb-2">Cambios pendientes:</h4>
                  <div class="text-sm text-yellow-700 space-y-1">
                    @if (studentsToAdd().length > 0) {
                      <p>• <strong>{{ studentsToAdd().length }}</strong> estudiante(s) se asignarán al apoderado</p>
                    }
                    @if (studentsToRemove().length > 0) {
                      <p>• <strong>{{ studentsToRemove().length }}</strong> estudiante(s) se removerán del apoderado</p>
                    }
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- Filtros y Paginación -->
          <div class="mb-6 grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Buscar Alumno</label>
              <input
                type="text"
                [ngModel]="searchTerm()"
                (ngModelChange)="updateSearchTerm($event)"
                placeholder="Nombre, apellido o código..."
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Nivel</label>
              <select
                [ngModel]="filterNivel()"
                (ngModelChange)="updateFilterNivel($event)"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Todos los niveles</option>
                @for (nivel of uniqueNiveles(); track nivel) {
                  <option [value]="nivel">{{ nivel }}</option>
                }
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Grado</label>
              <select
                [ngModel]="filterGrado()"
                (ngModelChange)="updateFilterGrado($event)"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Todos los grados</option>
                @for (grado of uniqueGrados(); track grado) {
                  <option [value]="grado">{{ grado }}°</option>
                }
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select
                [ngModel]="filterStatus()"
                (ngModelChange)="updateFilterStatus($event)"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Todos</option>
                <option value="sin-apoderado">Sin apoderado</option>
                <option value="con-apoderado">Con apoderado</option>
                <option value="asignado-este">Asignado a este apoderado</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Mostrar</label>
              <select
                [ngModel]="itemsPerPage()"
                (ngModelChange)="changePageSize($event)"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                @for (size of pageSizeOptions; track size) {
                  <option [value]="size">{{ size }} por página</option>
                }
              </select>
            </div>
          </div>

          <!-- Información de resultados -->
          <div class="flex justify-between items-center mb-4">
            <div class="text-sm text-gray-600">
              @if (totalItems() > 0) {
                Mostrando {{ showingRange().start }} - {{ showingRange().end }} de {{ totalItems() }} alumnos
              } @else {
                No se encontraron alumnos
              }
            </div>
          </div>

          <!-- Tabla de Alumnos -->
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      [checked]="isAllSelected()"
                      [indeterminate]="isIndeterminate()"
                      (change)="toggleAllSelection()"
                      class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Código
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Alumno
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grado/Sección
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                @for (alumno of paginatedAlumnos(); track alumno.id_alumno) {
                  <tr [class]="getRowClass(alumno)">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        [checked]="isStudentSelected(alumno.id_alumno)"
                        (change)="toggleStudentSelection(alumno.id_alumno)"
                        class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {{ alumno.codigo }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10">
                          <div class="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                            <span class="text-sm font-medium text-white">
                              {{ alumno.nombre[0] }}{{ alumno.apellido[0] }}
                            </span>
                          </div>
                        </div>
                        <div class="ml-4">
                          <div class="text-sm font-medium text-gray-900">
                            {{ alumno.nombre }} {{ alumno.apellido }}
                          </div>
                          <div class="text-sm text-gray-500">
                            DNI: {{ alumno.dni_alumno }}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm text-gray-900">{{ alumno.nivel }}</div>
                      <div class="text-sm text-gray-500">{{ alumno.grado }}° "{{ alumno.seccion }}"</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      @if (isInitiallyAssigned(alumno.id_alumno)) {
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <i class="fas fa-link mr-1"></i>
                          Asignado a este apoderado
                        </span>
                      } @else if (alumno.apoderado) {
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <i class="fas fa-user-check mr-1"></i>
                          Tiene otro apoderado
                        </span>
                      } @else {
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <i class="fas fa-user-times mr-1"></i>
                          Sin apoderado
                        </span>
                      }
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                      @if (isStudentToAdd(alumno.id_alumno)) {
                        <span class="text-green-600 font-medium">
                          <i class="fas fa-plus-circle mr-1"></i>
                          Se asignará
                        </span>
                      } @else if (isStudentToRemove(alumno.id_alumno)) {
                        <span class="text-red-600 font-medium">
                          <i class="fas fa-minus-circle mr-1"></i>
                          Se removerá
                        </span>
                      } @else {
                        <span class="text-gray-400">Sin cambios</span>
                      }
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="6" class="px-6 py-12 text-center text-gray-500">
                      <i class="fas fa-search text-4xl mb-4"></i>
                      <p>No se encontraron alumnos con los filtros aplicados</p>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Paginación -->
          @if (totalPages() > 1) {
            <div class="mt-6 flex items-center justify-between border-t border-gray-200 pt-6">
              <div class="flex-1 flex justify-between sm:hidden">
                <button
                  (click)="goToPage(currentPage() - 1)"
                  [disabled]="currentPage() === 1"
                  class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                  Anterior
                </button>
                <span class="text-sm text-gray-700 px-4 py-2">
                  Página {{ currentPage() }} de {{ totalPages() }}
                </span>
                <button
                  (click)="goToPage(currentPage() + 1)"
                  [disabled]="currentPage() === totalPages()"
                  class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                  Siguiente
                </button>
              </div>
              
              <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p class="text-sm text-gray-700">
                    Mostrando 
                    <span class="font-medium">{{ showingRange().start }}</span>
                    a 
                    <span class="font-medium">{{ showingRange().end }}</span>
                    de 
                    <span class="font-medium">{{ totalItems() }}</span>
                    resultados
                  </p>
                </div>
                <div>
                  <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      (click)="goToPage(currentPage() - 1)"
                      [disabled]="currentPage() === 1"
                      class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                      <i class="fas fa-chevron-left"></i>
                    </button>

                    @if (getVisiblePages().includes(1)) {
                      <button
                        (click)="goToPage(1)"
                        [class]="getPageButtonClass(1)"
                        class="relative inline-flex items-center px-4 py-2 border text-sm font-medium">
                        1
                      </button>
                    }

                    @if (getVisiblePages()[0] > 2) {
                      <span class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                        ...
                      </span>
                    }

                    @for (page of getVisiblePages(); track page) {
                      @if (page !== 1 && page !== totalPages()) {
                        <button
                          (click)="goToPage(page)"
                          [class]="getPageButtonClass(page)"
                          class="relative inline-flex items-center px-4 py-2 border text-sm font-medium">
                          {{ page }}
                        </button>
                      }
                    }

                    @if (getVisiblePages()[getVisiblePages().length - 1] < totalPages() - 1) {
                      <span class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                        ...
                      </span>
                    }

                    @if (totalPages() > 1 && getVisiblePages().includes(totalPages())) {
                      <button
                        (click)="goToPage(totalPages())"
                        [class]="getPageButtonClass(totalPages())"
                        class="relative inline-flex items-center px-4 py-2 border text-sm font-medium">
                        {{ totalPages() }}
                      </button>
                    }

                    <button
                      (click)="goToPage(currentPage() + 1)"
                      [disabled]="currentPage() === totalPages()"
                      class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                      <i class="fas fa-chevron-right"></i>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          }

          <!-- Acciones -->
          @if (hasChanges()) {
            <div class="mt-6 bg-gray-50 rounded-lg p-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <i class="fas fa-info-circle text-blue-500 mr-2"></i>
                  <div class="text-sm text-gray-700">
                    <div class="font-medium mb-1">Cambios pendientes para {{ selectedApoderado()!.nombre }} {{ selectedApoderado()!.apellido || '' }}:</div>
                    <div class="space-y-1">
                      @if (studentsToAdd().length > 0) {
                        <div class="text-green-700">• Asignar {{ studentsToAdd().length }} estudiante(s)</div>
                      }
                      @if (studentsToRemove().length > 0) {
                        <div class="text-red-700">• Remover {{ studentsToRemove().length }} estudiante(s)</div>
                      }
                    </div>
                  </div>
                </div>
                <div class="flex space-x-3">
                  <button
                    (click)="resetChanges()"
                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    Cancelar
                  </button>
                  <button
                    (click)="saveChanges()"
                    class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      }



      <!-- Success Message -->
      @if (showSuccessMessage()) {
        <div class="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          <i class="fas fa-check-circle mr-2"></i>
          Cambios guardados exitosamente
        </div>
      }

      <!-- Error Message -->
      @if (errorMessage()) {
        <div class="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          <i class="fas fa-exclamation-circle mr-2"></i>
          {{ errorMessage() }}
        </div>
      }
    </div>
  `
})
export class AssignStudentsComponent implements OnInit {
  private apoderadoService = inject(ApoderadoAsignService);
  private alumnoService = inject(AlumnoAsignService);

  // Data Signals
  apoderados = signal<Apoderado[]>([]);
  alumnos = signal<Alumno[]>([]);
  selectedApoderado = signal<Apoderado | null>(null);
  selectedStudents = signal<string[]>([]);
  initiallyAssignedStudents = signal<string[]>([]); // IDs de estudiantes inicialmente asignados
  showSuccessMessage = signal(false);
  errorMessage = signal('');

  // Filter Signals
  searchApoderado = signal('');
  searchTerm = signal('');
  filterNivel = signal('');
  filterGrado = signal('');
  filterStatus = signal('');

  // Pagination Signals
  currentPage = signal(1);
  itemsPerPage = signal(10);
  pageSizeOptions = [5, 10, 20, 50];

  ngOnInit() {
    this.loadData();
  }

  // Computed para cambios
  studentsToAdd = computed(() => {
    const selected = this.selectedStudents();
    const initial = this.initiallyAssignedStudents();
    return selected.filter(id => !initial.includes(id));
  });

  studentsToRemove = computed(() => {
    const selected = this.selectedStudents();
    const initial = this.initiallyAssignedStudents();
    return initial.filter(id => !selected.includes(id));
  });

  hasChanges = computed(() => {
    return this.studentsToAdd().length > 0 || this.studentsToRemove().length > 0;
  });

  // Computed para apoderados filtrados
  filteredApoderados = computed(() => {
    let filtered = this.apoderados();
    
    if (this.searchApoderado()) {
      const term = this.searchApoderado().toLowerCase();
      filtered = filtered.filter(apoderado => 
        apoderado.nombre.toLowerCase().includes(term) ||
        (apoderado.apellido && apoderado.apellido.toLowerCase().includes(term)) ||
        (apoderado.dni && apoderado.dni.toLowerCase().includes(term)) ||
        apoderado.tipo_relacion.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  });

  // Computed para alumnos filtrados
  filteredAlumnos = computed(() => {
    let filtered = this.alumnos();

    // Search filter
    if (this.searchTerm()) {
      const term = this.searchTerm().toLowerCase();
      filtered = filtered.filter(alumno => 
        alumno.nombre.toLowerCase().includes(term) ||
        alumno.apellido.toLowerCase().includes(term) ||
        alumno.codigo.toLowerCase().includes(term) ||
        alumno.dni_alumno.toLowerCase().includes(term)
      );
    }

    // Nivel filter
    if (this.filterNivel()) {
      filtered = filtered.filter(alumno => alumno.nivel === this.filterNivel());
    }

    // Grado filter
    if (this.filterGrado()) {
      filtered = filtered.filter(alumno => alumno.grado.toString() === this.filterGrado());
    }

    // Status filter
    if (this.filterStatus() === 'sin-apoderado') {
      filtered = filtered.filter(alumno => !alumno.apoderado);
    } else if (this.filterStatus() === 'con-apoderado') {
      filtered = filtered.filter(alumno => alumno.apoderado);
    } else if (this.filterStatus() === 'asignado-este') {
      filtered = filtered.filter(alumno => this.isInitiallyAssigned(alumno.id_alumno));
    }

    return filtered;
  });

  paginatedAlumnos = computed(() => {
    const filtered = this.filteredAlumnos();
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    const end = start + this.itemsPerPage();
    return filtered.slice(start, end);
  });

  totalPages = computed(() => {
    return Math.ceil(this.filteredAlumnos().length / this.itemsPerPage());
  });

  totalItems = computed(() => {
    return this.filteredAlumnos().length;
  });

  showingRange = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage() + 1;
    const end = Math.min(this.currentPage() * this.itemsPerPage(), this.totalItems());
    return { start, end };
  });

  uniqueNiveles = computed(() => {
    const niveles = [...new Set(this.alumnos().map(a => a.nivel))];
    return niveles.sort();
  });

  uniqueGrados = computed(() => {
    const grados = [...new Set(this.alumnos().map(a => a.grado))];
    return grados.sort((a, b) => a - b);
  });

  // Métodos para actualizar filtros y resetear paginación
  updateSearchTerm(value: string) {
    this.searchTerm.set(value);
    this.resetPagination();
  }

  updateFilterNivel(value: string) {
    this.filterNivel.set(value);
    this.resetPagination();
  }

  updateFilterGrado(value: string) {
    this.filterGrado.set(value);
    this.resetPagination();
  }

  updateFilterStatus(value: string) {
    this.filterStatus.set(value);
    this.resetPagination();
  }

  private async loadData() {
    try {
      const [apoderados, alumnos] = await Promise.all([
        this.apoderadoService.getAllApoderados().toPromise(),
        this.alumnoService.getAllAlumnos().toPromise()
      ]);

      this.apoderados.set(apoderados || []);
      this.alumnos.set(alumnos || []);
    } catch (error) {
      this.showError('Error al cargar los datos');
    } finally {
    }
  }

  selectApoderado(apoderado: Apoderado) {
    this.selectedApoderado.set(apoderado);
    
    // Extraer IDs de estudiantes ya asignados
    const assignedIds = apoderado.pupilos?.map(pupilo => pupilo.id_alumno) || [];
    this.initiallyAssignedStudents.set(assignedIds);
    
    // Pre-seleccionar estudiantes ya asignados
    this.selectedStudents.set([...assignedIds]);
  }

  getApoderadoCardClass(apoderado: Apoderado): string {
    const baseClass = 'border-2 rounded-lg hover:shadow-lg';
    if (this.selectedApoderado()?.id_apoderado === apoderado.id_apoderado) {
      return `${baseClass} border-blue-500 bg-blue-50 shadow-md`;
    }
    return `${baseClass} border-gray-200 bg-white hover:border-gray-300`;
  }

  toggleStudentSelection(studentId: string) {
    const current = this.selectedStudents();
    if (current.includes(studentId)) {
      this.selectedStudents.set(current.filter(id => id !== studentId));
    } else {
      this.selectedStudents.set([...current, studentId]);
    }
  }

  isStudentSelected(studentId: string): boolean {
    return this.selectedStudents().includes(studentId);
  }

  isInitiallyAssigned(studentId: string): boolean {
    return this.initiallyAssignedStudents().includes(studentId);
  }

  isStudentToAdd(studentId: string): boolean {
    return this.studentsToAdd().includes(studentId);
  }

  isStudentToRemove(studentId: string): boolean {
    return this.studentsToRemove().includes(studentId);
  }

  toggleAllSelection() {
    const pageStudents = this.paginatedAlumnos();
    const allPageSelected = pageStudents.every(alumno => this.isStudentSelected(alumno.id_alumno));
    
    if (allPageSelected) {
      // Deselect all current page students
      const toRemove = pageStudents.map(a => a.id_alumno);
      this.selectedStudents.set(
        this.selectedStudents().filter(id => !toRemove.includes(id))
      );
    } else {
      // Select all current page students
      const toAdd = pageStudents
        .filter(a => !this.isStudentSelected(a.id_alumno))
        .map(a => a.id_alumno);
      this.selectedStudents.set([...this.selectedStudents(), ...toAdd]);
    }
  }

  isAllSelected(): boolean {
    const pageStudents = this.paginatedAlumnos();
    return pageStudents.length > 0 && pageStudents.every(alumno => this.isStudentSelected(alumno.id_alumno));
  }

  isIndeterminate(): boolean {
    const pageStudents = this.paginatedAlumnos();
    const selectedCount = pageStudents.filter(alumno => this.isStudentSelected(alumno.id_alumno)).length;
    return selectedCount > 0 && selectedCount < pageStudents.length;
  }

  resetChanges() {
    // Volver al estado inicial
    this.selectedStudents.set([...this.initiallyAssignedStudents()]);
  }

  getRowClass(alumno: Alumno): string {
    if (this.isStudentToAdd(alumno.id_alumno)) {
      return 'bg-green-50 border-l-4 border-green-400';
    } else if (this.isStudentToRemove(alumno.id_alumno)) {
      return 'bg-red-50 border-l-4 border-red-400';
    } else if (this.isStudentSelected(alumno.id_alumno)) {
      return 'bg-blue-50';
    }
    return 'hover:bg-gray-50';
  }

  async saveChanges() {
    if (!this.selectedApoderado() || !this.hasChanges()) {
      return;
    }

    try {
      const apoderadoId = this.selectedApoderado()!.id_apoderado;
      const promises = [];

      // Asignar nuevos estudiantes
      if (this.studentsToAdd().length > 0) {
        promises.push(
          this.apoderadoService.assignStudentsToApoderado(apoderadoId, {
            estudiante_ids: this.studentsToAdd()
          }).toPromise()
        );
      }

      // Remover estudiantes
      if (this.studentsToRemove().length > 0) {
        promises.push(
          this.apoderadoService.removeStudentsFromApoderado(apoderadoId, {
            estudiante_ids: this.studentsToRemove()
          }).toPromise()
        );
      }

      // Ejecutar todas las operaciones
      await Promise.all(promises);

      this.showSuccess();
      
      // Actualizar el estado inicial con los cambios aplicados
      this.initiallyAssignedStudents.set([...this.selectedStudents()]);
      
      // Recargar datos para reflejar cambios
      await this.loadData();

    } catch (error) {
      this.showError('Error al guardar los cambios');
    } finally {
    }
  }

  private showSuccess() {
    this.showSuccessMessage.set(true);
    setTimeout(() => this.showSuccessMessage.set(false), 3000);
  }

  private showError(message: string) {
    this.errorMessage.set(message);
    setTimeout(() => this.errorMessage.set(''), 3000);
  }

  // Pagination methods
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  changePageSize(newSize: number) {
    this.itemsPerPage.set(newSize);
    this.currentPage.set(1);
  }

  resetPagination() {
    this.currentPage.set(1);
  }

  getVisiblePages(): number[] {
    const current = this.currentPage();
    const total = this.totalPages();
    const delta = 2;
    
    let start = Math.max(1, current - delta);
    let end = Math.min(total, current + delta);
    
    if (current <= delta + 1) {
      end = Math.min(total, delta * 2 + 1);
    }
    
    if (current >= total - delta) {
      start = Math.max(1, total - delta * 2);
    }
    
    const pages: number[] = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  getPageButtonClass(page: number): string {
    if (page === this.currentPage()) {
      return 'bg-blue-50 border-blue-500 text-blue-600 hover:bg-blue-50';
    }
    return 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50';
  }
}