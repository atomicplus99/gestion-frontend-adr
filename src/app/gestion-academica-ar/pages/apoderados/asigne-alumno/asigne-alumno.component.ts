// assign-students.component.ts
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApoderadoAsignService } from './services/apoderado-asigne.service';
import { AlumnoAsignService } from './services/alumno-asign.service';
import { Alumno, Apoderado, ApoderadosResponseDto, AlumnosResponseDto, ErrorResponseDto, ConflictErrorResponseDto, AssignmentErrorResponseDto } from './models/AsignarAlumnoApoderado.model';

@Component({
  selector: 'app-assign-students',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="w-full px-4 py-8 min-h-screen bg-white">
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
          
          <!-- Botón de recargar datos -->
          <div class="mt-2">
            <button 
              (click)="loadData()"
              class="text-sm text-blue-600 hover:text-blue-800 underline">
              🔄 Recargar datos
            </button>
          </div>
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
          <div class="mt-6 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-sm">
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <div class="flex-shrink-0 h-10 w-10 mr-3">
                  <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <i class="fas fa-user-check text-blue-600 text-lg"></i>
                  </div>
                </div>
                <div>
                  <span class="font-semibold text-blue-900 text-lg">
                    Apoderado seleccionado: {{ selectedApoderado()!.nombre }} {{ selectedApoderado()!.apellido || '' }}
                  </span>
                  <div class="text-sm text-blue-700 mt-1">
                    DNI: {{ selectedApoderado()!.dni || 'N/A' }} • {{ selectedApoderado()!.tipo_relacion }}
                  </div>
                </div>
              </div>
              @if (initiallyAssignedStudents().length > 0) {
                <span class="text-sm text-blue-700 bg-blue-100 px-4 py-2 rounded-full font-medium border border-blue-200">
                  <i class="fas fa-users mr-1"></i>
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
              <div class="flex items-center space-x-3">
                <div class="flex items-center bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <div class="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span class="text-sm font-medium text-green-800">
                    {{ studentsToAdd().length }} para asignar
                  </span>
                </div>
                <div class="flex items-center bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <div class="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                  <span class="text-sm font-medium text-red-800">
                    {{ studentsToRemove().length }} para remover
                  </span>
                </div>
                <div class="flex items-center bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                  <div class="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  <span class="text-sm font-medium text-blue-800">
                    {{ selectedStudents().length }} total seleccionados
                  </span>
                </div>
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
                <option value="todos">Todos</option>
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
              <thead class="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th class="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      [checked]="isAllSelected()"
                      [indeterminate]="isIndeterminate()"
                      (change)="toggleAllSelection()"
                      class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                  </th>
                  <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <i class="fas fa-hashtag mr-2 text-gray-400"></i>
                    Código
                  </th>
                  <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <i class="fas fa-user-graduate mr-2 text-gray-400"></i>
                    Alumno
                  </th>
                  <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <i class="fas fa-graduation-cap mr-2 text-gray-400"></i>
                    Grado/Sección
                  </th>
                  <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <i class="fas fa-info-circle mr-2 text-gray-400"></i>
                    Estado
                  </th>
                  <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <i class="fas fa-user-tie mr-2 text-gray-400"></i>
                    Apoderado Actual
                  </th>
                  <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <i class="fas fa-cogs mr-2 text-gray-400"></i>
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
                        <div class="flex-shrink-0 h-12 w-12">
                          <div class="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                            <span class="text-sm font-bold text-white">
                              {{ alumno.nombre[0] }}{{ alumno.apellido[0] }}
                            </span>
                          </div>
                        </div>
                        <div class="ml-4 flex-1 min-w-0">
                          <div class="text-sm font-semibold text-gray-900 truncate">
                            {{ alumno.nombre }} {{ alumno.apellido }}
                          </div>
                          <div class="text-sm text-gray-500">
                            DNI: {{ alumno.dni_alumno }}
                          </div>
                          <div class="text-xs text-blue-600 font-medium">
                            Código: {{ alumno.codigo }}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <div class="flex-shrink-0 h-8 w-8 mr-3">
                          <div class="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                            <i class="fas fa-graduation-cap text-indigo-600 text-sm"></i>
                          </div>
                        </div>
                        <div class="flex-1">
                          <div class="text-sm font-medium text-gray-900">{{ alumno.nivel }}</div>
                          <div class="text-sm text-gray-600 font-semibold">{{ alumno.grado }}° "{{ alumno.seccion }}"</div>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      @if (isInitiallyAssigned(alumno.id_alumno)) {
                        <div class="flex items-center">
                          <div class="flex-shrink-0 h-2 w-2 bg-blue-500 rounded-full mr-2"></div>
                          <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                            <i class="fas fa-link mr-1"></i>
                            Asignado a este apoderado
                          </span>
                        </div>
                      } @else if (alumno.apoderado) {
                        <div class="flex items-center">
                          <div class="flex-shrink-0 h-2 w-2 bg-yellow-500 rounded-full mr-2"></div>
                          <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                            <i class="fas fa-user-check mr-1"></i>
                            Tiene otro apoderado
                          </span>
                        </div>
                      } @else {
                        <div class="flex items-center">
                          <div class="flex-shrink-0 h-2 w-2 bg-gray-400 rounded-full mr-2"></div>
                          <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                            <i class="fas fa-user-times mr-1"></i>
                            Sin apoderado
                          </span>
                        </div>
                      }
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      @if (alumno.apoderado) {
                        <div class="flex items-center">
                          <div class="flex-shrink-0 h-8 w-8 mr-3">
                            <div class="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <i class="fas fa-user text-blue-600 text-sm"></i>
                            </div>
                          </div>
                          <div class="flex-1 min-w-0">
                            <div class="text-sm font-medium text-gray-900 truncate">
                              {{ alumno.apoderado.nombre }} {{ alumno.apoderado.apellido || '' }}
                            </div>
                            <div class="text-xs text-gray-500">
                              DNI: {{ alumno.apoderado.dni || 'N/A' }}
                            </div>
                            @if (alumno.apoderado.tipo_relacion) {
                              <div class="text-xs text-blue-600 font-medium">
                                {{ alumno.apoderado.tipo_relacion }}
                              </div>
                            }
                          </div>
                        </div>
                      } @else {
                        <div class="flex items-center">
                          <div class="flex-shrink-0 h-8 w-8 mr-3">
                            <div class="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                              <i class="fas fa-user-slash text-gray-400 text-sm"></i>
                            </div>
                          </div>
                          <span class="text-gray-400 text-sm font-medium">
                            Sin apoderado
                          </span>
                        </div>
                      }
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                      @if (isStudentToAdd(alumno.id_alumno)) {
                        <div class="flex items-center">
                          <div class="flex-shrink-0 h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                          <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                            <i class="fas fa-plus-circle mr-1"></i>
                            Se asignará
                          </span>
                        </div>
                      } @else if (isStudentToRemove(alumno.id_alumno)) {
                        <div class="flex items-center">
                          <div class="flex-shrink-0 h-2 w-2 bg-red-500 rounded-full mr-2"></div>
                          <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                            <i class="fas fa-minus-circle mr-1"></i>
                            Se removerá
                          </span>
                        </div>
                      } @else {
                        <div class="flex items-center">
                          <div class="flex-shrink-0 h-2 w-2 bg-gray-300 rounded-full mr-2"></div>
                          <span class="text-gray-500 text-xs font-medium">Sin cambios</span>
                        </div>
                      }
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="7" class="px-6 py-12 text-center text-gray-500">
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
  filterStatus = signal('todos'); // Cambiar temporalmente para debug

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

  // ✅ Computed para validar alumnos que ya tienen otro apoderado
  studentsWithOtherGuardian = computed(() => {
    const toAdd = this.studentsToAdd();
    const allAlumnos = this.alumnos();
    
    return toAdd.filter(studentId => {
      const alumno = allAlumnos.find(a => a.id_alumno === studentId);
      // Verificar si el alumno ya tiene un apoderado diferente
      return alumno && alumno.apoderado && 
             alumno.apoderado.id_apoderado !== this.selectedApoderado()?.id_apoderado;
    });
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
    
    // ✅ Debug: verificar datos disponibles
    
    
    if (this.searchApoderado()) {
      const term = this.searchApoderado().toLowerCase();
      
      
      filtered = filtered.filter(apoderado => {
        const matches = 
          apoderado.nombre.toLowerCase().includes(term) ||
          (apoderado.apellido && apoderado.apellido.toLowerCase().includes(term)) ||
          (apoderado.dni && apoderado.dni.toLowerCase().includes(term)) ||
          apoderado.tipo_relacion.toLowerCase().includes(term);
        
        
        
        return matches;
      });
      
      
    }
    
    return filtered;
  });

  // Computed para alumnos filtrados
  filteredAlumnos = computed(() => {
    let filtered = this.alumnos();
    
    // ✅ Validación de seguridad
    if (!filtered || !Array.isArray(filtered)) {
      
      return [];
    }
    
    

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
      
    } else if (this.filterStatus() === 'todos') {
      // No filtrar por estado - mostrar todos
      
    }

    
    return filtered;
  });

  paginatedAlumnos = computed(() => {
    const filtered = this.filteredAlumnos();
    
    // ✅ Validación de seguridad adicional
    if (!filtered || !Array.isArray(filtered)) {
      
      return [];
    }
    
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    const end = start + this.itemsPerPage();
    const paginated = filtered.slice(start, end);
    
    
    
    return paginated;
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
    const alumnos = this.alumnos();
    if (!alumnos || !Array.isArray(alumnos)) {
      return [];
    }
    const niveles = [...new Set(alumnos.map(a => a.nivel))];
    return niveles && Array.isArray(niveles) ? niveles.sort() : [];
  });

  uniqueGrados = computed(() => {
    const alumnos = this.alumnos();
    if (!alumnos || !Array.isArray(alumnos)) {
      return [];
    }
    const grados = [...new Set(alumnos.map(a => a.grado))];
    return grados && Array.isArray(grados) ? grados.sort((a, b) => a - b) : [];
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

  // ✅ Método temporal para debug
  toggleFilterForDebug() {
    const currentFilter = this.filterStatus();
    let newFilter = '';
    
    if (currentFilter === 'todos') {
      newFilter = 'con-apoderado';
    } else if (currentFilter === 'con-apoderado') {
      newFilter = 'sin-apoderado';
    } else if (currentFilter === 'sin-apoderado') {
      newFilter = 'asignado-este';
    } else {
      newFilter = 'todos';
    }
    
    
    this.filterStatus.set(newFilter);
    this.resetPagination();
  }

  async loadData() {
    try {
      
      
      // ✅ Usar firstValueFrom en lugar de toPromise() para evitar problemas de iteración
      const [apoderadosResponse, alumnosResponse] = await Promise.all([
        firstValueFrom(this.apoderadoService.getAllApoderados()).then(result => result || {}),
        firstValueFrom(this.alumnoService.getAllAlumnos()).then(result => result || {})
      ]);

      

            // ✅ Función helper para extraer datos del backend
      const extractData = (response: any): any[] => {
        // Si la respuesta tiene estructura {success, message, data}
        if (response && typeof response === 'object' && 'data' in response) {
          return response.data && Array.isArray(response.data) ? response.data : [];
        }
        // Si la respuesta es directamente un array
        if (Array.isArray(response)) {
          return response;
        }
        // Si no es ninguna de las anteriores, devolver array vacío
        return [];
      };

      // ✅ Extraer datos usando la función helper
      const apoderados = extractData(apoderadosResponse);
      const alumnos = extractData(alumnosResponse);

      // ✅ Asegurar que siempre sean arrays
      const apoderadosArray = Array.isArray(apoderados) ? apoderados : [];
      const alumnosArray = Array.isArray(alumnos) ? alumnos : [];



      

      // ✅ Log detallado de la estructura de los primeros alumnos
      if (alumnosArray.length > 0) {
        
        
        // ✅ Verificar si hay alumnos con apoderado
        const alumnosConApoderado = alumnosArray.filter(a => a.apoderado);
        const alumnosSinApoderado = alumnosArray.filter(a => !a.apoderado);
        
        
        
      }

      this.apoderados.set(apoderadosArray);
      this.alumnos.set(alumnosArray);
      
      
    } catch (error) {
      
      this.showError('Error al cargar los datos');
      // ✅ Establecer arrays vacíos en caso de error
      this.apoderados.set([]);
      this.alumnos.set([]);
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
    const baseClass = 'border-2 rounded-xl hover:shadow-lg transition-all duration-200';
    if (this.selectedApoderado()?.id_apoderado === apoderado.id_apoderado) {
      return `${baseClass} border-blue-500 bg-blue-50 shadow-lg`;
    }
    return `${baseClass} border-gray-200 bg-white hover:border-gray-300 hover:shadow-md`;
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

  // ✅ Verificar si un alumno puede ser asignado a este apoderado
  canAssignStudent(studentId: string): boolean {
    const alumno = this.alumnos().find(a => a.id_alumno === studentId);
    if (!alumno) return false;
    
    // Si no tiene apoderado, se puede asignar
    if (!alumno.apoderado) return true;
    
    // Si ya tiene este apoderado, no se puede asignar de nuevo
    if (alumno.apoderado.id_apoderado === this.selectedApoderado()?.id_apoderado) return false;
    
    // Si tiene otro apoderado, no se puede asignar
    return false;
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
    } else if (alumno.apoderado && alumno.apoderado.id_apoderado !== this.selectedApoderado()?.id_apoderado) {
      // ✅ Alumno que ya tiene otro apoderado
      return 'bg-orange-50 border-l-4 border-orange-400';
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
      
      // ✅ Debug: verificar qué cambios se van a aplicar
      
      
      // ✅ Validación adicional: verificar si hay alumnos que ya tienen apoderado
      const allAlumnos = this.alumnos();
      const alumnosConOtroApoderado = this.studentsToAdd().filter(id => {
        const alumno = allAlumnos.find(a => a.id_alumno === id);
        return alumno && alumno.apoderado && 
               alumno.apoderado.id_apoderado !== apoderadoId;
      });
      
      if (alumnosConOtroApoderado.length > 0) {
        
      }

      // Asignar nuevos estudiantes
      if (this.studentsToAdd().length > 0) {
        promises.push(
          firstValueFrom(this.apoderadoService.assignStudentsToApoderado(apoderadoId, {
            estudiante_ids: this.studentsToAdd()  // ✅ Corregido: usar studentsToAdd en lugar de studentsToRemove
          })).then(result => result || {})
        );
      }

      // Remover estudiantes
      if (this.studentsToRemove().length > 0) {
        promises.push(
          firstValueFrom(this.apoderadoService.removeStudentsFromApoderado(apoderadoId, {
            estudiante_ids: this.studentsToRemove()
          })).then(result => result || {})
        );
      }

      // Ejecutar todas las operaciones
      const results = await Promise.all(promises);
      
      // ✅ Debug: verificar respuestas del backend
      
      
      // ✅ Verificar si las operaciones fueron exitosas
      for (const result of results) {
        if (result && typeof result === 'object' && 'success' in result) {
          const response = result as any;
          if (response.success) {
            
          }
        }
      }
      
      this.showSuccess();
      
      // Actualizar el estado inicial con los cambios aplicados
      this.initiallyAssignedStudents.set([...this.selectedStudents()]);
      
      // Recargar datos para reflejar cambios
      await this.loadData();

    } catch (error: any) {
      // ✅ Manejar específicamente el código 409 (Conflict) del backend
      if (error.status === 409) {
        
        
        // Extraer información específica del error del backend con tipado fuerte
        const errorData = error.error as ConflictErrorResponseDto;
        let errorMessage = 'Error: Algunos alumnos ya tienen apoderado';
        let suggestion = 'Un alumno solo puede tener un apoderado. Remueva la asignación anterior antes de asignar a un nuevo apoderado.';
        
        if (errorData && errorData.alumnosConApoderado) {
          const alumnosProblematicos = errorData.alumnosConApoderado;
          errorMessage = `No se pueden asignar los siguientes alumnos: ${alumnosProblematicos.join(', ')}. Ya tienen apoderado asignado.`;
        }
        
        if (errorData && errorData.suggestion) {
          suggestion = errorData.suggestion;
        }
        
        // Mostrar error principal
        this.showError(errorMessage);
        
        // Mostrar sugerencia después de un delay
        setTimeout(() => {
          this.showError(`💡 Sugerencia: ${suggestion}`);
        }, 3500);
        
      } else if (error.status === 400) {
        // ✅ Manejar código 400 (Bad Request) - ASSIGNMENT_ERROR
        const errorData = error.error as AssignmentErrorResponseDto;
        const errorMessage = errorData?.message || 'Error en la solicitud';
        this.showError(`❌ Error: ${errorMessage}`);
        
        
      } else {
        // ✅ Otros errores (500, 404, etc.)
        const errorMessage = error.error?.message || 'Error al guardar los cambios';
        this.showError(`❌ Error: ${errorMessage}`);
        
      }
    } finally {
    }
  }

  private showSuccess() {
    this.showSuccessMessage.set(true);
    setTimeout(() => this.showSuccessMessage.set(false), 3000);
  }

  private showError(message: string) {
    this.errorMessage.set(message);
    // ✅ Mostrar mensajes de error por más tiempo si son largos
    const displayTime = message.length > 100 ? 6000 : 4000;
    setTimeout(() => this.errorMessage.set(''), displayTime);
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