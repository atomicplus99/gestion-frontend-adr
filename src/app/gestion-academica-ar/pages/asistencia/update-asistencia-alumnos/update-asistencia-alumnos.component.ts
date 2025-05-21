import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

import Swal from 'sweetalert2';
import { environment } from '../../../../../environments/environment';

interface Asistencia {
  id_asistencia: string;
  hora_de_llegada: string;
  hora_salida: string | null;
  estado_asistencia: 'PUNTUAL' | 'TARDE' | 'FALTA';
  fecha: string;
}

interface AlumnoConAsistencia {
  nombre: string;
  apellido: string;
  codigo: string;
  asistencias: Asistencia[];
}

@Component({
  selector: 'app-update-asistencia-alumnos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="container mx-auto p-6">
      <h2 class="text-2xl font-semibold mb-4 text-gray-800">Consultar Asistencia de Alumno</h2>

      <div class="bg-white shadow-md rounded-lg p-6 mb-6">
        <div class="mb-4">
          <label for="codigo" class="block text-gray-700 text-sm font-bold mb-2">
            Código del Alumno:
          </label>
          <div class="flex rounded-md shadow-sm">
            <input
              type="text"
              id="codigo"
              class="form-input flex-grow block w-full min-w-0 rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Ingrese el código del alumno"
              [formControl]="codigoControl"
            />
            <button
              (click)="buscarAsistencia()"
              class="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-6a7 7 0 10-14 0 7 7 0 0014 0z" />
              </svg>
              Buscar
            </button>
          </div>
          <div *ngIf="codigoControl.invalid && (codigoControl.dirty || codigoControl.touched)" class="text-red-500 text-sm mt-1">
            El código del alumno es requerido.
          </div>
        </div>

        <div *ngIf="alumnoConAsistencia()" class="mt-6 border-t pt-6">
          <h3 class="text-xl font-semibold text-gray-800 mb-3">Información del Alumno</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <strong class="font-medium text-gray-700">Nombre:</strong>
              <span class="text-gray-600">{{ alumnoConAsistencia()?.nombre }}</span>
            </div>
            <div>
              <strong class="font-medium text-gray-700">Apellido:</strong>
              <span class="text-gray-600">{{ alumnoConAsistencia()?.apellido }}</span>
            </div>
            <div>
              <strong class="font-medium text-gray-700">Código:</strong>
              <span class="text-gray-600">{{ alumnoConAsistencia()?.codigo }}</span>
            </div>
          </div>

          <h3 class="text-xl font-semibold text-gray-800 mt-6 mb-3">Historial de Asistencia</h3>
          <div class="overflow-x-auto rounded-lg shadow ring-1 ring-gray-300">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora de Llegada</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora de Salida</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr *ngFor="let asistencia of alumnoConAsistencia()?.asistencias">
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ asistencia.fecha | date: 'dd/MM/yyyy' }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ asistencia.hora_de_llegada }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ asistencia.hora_salida || '-' }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      class="px-2 py-1 rounded-full text-xs font-semibold"
                      [ngClass]="{
                        'bg-green-100 text-green-800': asistencia.estado_asistencia === 'PUNTUAL',
                        'bg-yellow-100 text-yellow-800': asistencia.estado_asistencia === 'TARDE',
                        'bg-red-100 text-red-800': asistencia.estado_asistencia === 'FALTA'
                      }"
                    >{{ asistencia.estado_asistencia }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div *ngIf="mostrarMensajeNoAsistencia()" class="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-yellow-800">
                No se encontraron registros de asistencia para el alumno con código: {{ codigoControl.value }}.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpdateAsistenciaAlumnosComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  codigoControl = new FormControl('', Validators.required);
  alumnoConAsistencia = signal<AlumnoConAsistencia | null>(null);
  mostrarMensajeNoAsistencia = signal<boolean>(false);

  ngOnInit(): void {
    // Opcional: Puedes enfocar el input al cargar el componente
    const inputElement = document.getElementById('codigo') as HTMLInputElement;
    if (inputElement) {
      inputElement.focus();
    }
  }

  buscarAsistencia(): void {
    if (this.codigoControl.valid) {
      const codigo = this.codigoControl.value!;
      this.http.get<Asistencia[]>(`${this.apiUrl}/asistencia/list/alumno/${codigo}`).subscribe({
        next: (asistencias) => {
          console.log(asistencias);
          if (asistencias && asistencias.length > 0) {
            // Suponiendo que el backend también devuelve la información del alumno
            // Si no es así, necesitarías otra llamada para obtener los datos del alumno
            this.obtenerDatosAlumno(codigo, asistencias);
            this.mostrarMensajeNoAsistencia.set(false);
          } else {
            this.alumnoConAsistencia.set(null);
            this.mostrarMensajeNoAsistencia.set(true);
            Swal.fire({
              icon: 'error',
              title: 'No hay asistencia',
              text: `No se encontraron registros de asistencia para el alumno con código: ${codigo}`,
            });
          }
        },
        error: (error) => {
          this.alumnoConAsistencia.set(null);
          this.mostrarMensajeNoAsistencia.set(true);
          let errorMessage = 'Error al buscar la asistencia.';
          if (error.status === 404) {
            errorMessage = `No se encontró ningún alumno con el código: ${codigo}.`;
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          }
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: errorMessage,
          });
        },
      });
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Campo requerido',
        text: 'Por favor, ingresa el código del alumno.',
      });
    }
  }

  // Función auxiliar para obtener los datos del alumno (si el backend no los incluye en la respuesta de asistencia)
  private obtenerDatosAlumno(codigo: string, asistencias: Asistencia[]): void {
    this.http.get<any>(`${this.apiUrl}/asistencia/list/alumno/${codigo}`).subscribe({
      next: (alumno) => {
        this.alumnoConAsistencia.set({
          nombre: alumno.nombre,
          apellido: alumno.apellido,
          codigo: alumno.codigo,
          asistencias: asistencias,
        });
      },
      error: (error) => {
        console.error('Error al obtener datos del alumno', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron obtener los datos del alumno.',
        });
        this.alumnoConAsistencia.set(null);
        this.mostrarMensajeNoAsistencia.set(true);
      },
    });
  }
}