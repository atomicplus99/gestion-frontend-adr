import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ValidationService } from '../../services/validation.service';
import { GradosService } from '../../services/grados.service';
import { Turno } from '../../interfaces/AlumnoRegister.interface';


@Component({
  selector: 'app-academic-info-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="bg-gray-50 p-6 rounded-xl border border-gray-100">
      <h3 class="text-lg font-semibold mb-4 text-gray-700 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M12 14l9-5-9-5-9 5 9 5z" />
          <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
        </svg>
        Información Académica
      </h3>

      <div [formGroup]="formGroup">
        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- Turno -->
          <div>
            <label class="block text-sm font-semibold mb-1 text-gray-700">Turno</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <select formControlName="turno"
                class="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none appearance-none bg-white transition-colors">
                <option value="" disabled selected>Selecciona turno</option>
                <option *ngFor="let t of turnosSeguros" [value]="t.id_turno">
                  {{ t.turno }} ({{ t.hora_inicio }} - {{ t.hora_fin }})
                </option>
              </select>
              <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <p class="text-sm text-red-500 mt-1" *ngIf="getError('turno')">{{ getError('turno') }}</p>
          </div>

          <!-- Nivel -->
          <div>
            <label class="block text-sm font-semibold mb-1 text-gray-700">Nivel</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <select formControlName="nivel"
                class="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none appearance-none bg-white transition-colors">
                <option value="" disabled selected>Selecciona nivel</option>
                <option *ngFor="let nivel of (nivelesEducativos || [])" [value]="nivel">{{ nivel }}</option>
              </select>
              <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <p class="text-sm text-red-500 mt-1" *ngIf="getError('nivel')">{{ getError('nivel') }}</p>
          </div>

          <!-- Grado -->
          <div>
            <label class="block text-sm font-semibold mb-1 text-gray-700">Grado</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <select formControlName="grado"
                class="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none appearance-none bg-white transition-colors">
                <option value="" disabled selected>Selecciona grado</option>
                <option *ngFor="let g of (grados || [])" [value]="g">{{ g }}</option>
              </select>
              <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <p class="text-sm text-red-500 mt-1" *ngIf="getError('grado')">{{ getError('grado') }}</p>
          </div>

          <!-- Sección -->
          <div>
            <label class="block text-sm font-semibold mb-1 text-gray-700">Sección</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
              </div>
              <select formControlName="seccion"
                class="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none appearance-none bg-white transition-colors">
                <option value="" disabled selected>Selecciona sección</option>
                <option *ngFor="let s of (secciones || [])" [value]="s">{{ s }}</option>
              </select>
              <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <p class="text-sm text-red-500 mt-1" *ngIf="getError('seccion')">{{ getError('seccion') }}</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AcademicInfoFormComponent implements OnInit {
  @Input() formGroup!: FormGroup;
  @Input() turnos: Turno[] = [];
  
  private gradosService = inject(GradosService);
  
  grados: string[] = [];
  secciones: string[] = [];
  nivelesEducativos: string[] = [];

  // Getter para asegurar que turnos sea siempre un array
  get turnosSeguros(): Turno[] {
    return Array.isArray(this.turnos) ? this.turnos : [];
  }

  ngOnInit() {
    this.secciones = this.gradosService.obtenerSecciones();
    this.nivelesEducativos = this.gradosService.obtenerNivelesEducativos();
    
    // Escuchar cambios en el nivel para actualizar grados
    this.formGroup.get('nivel')?.valueChanges.subscribe((nivel) => {
      this.grados = this.gradosService.obtenerGradosPorNivel(nivel);
      this.formGroup.get('grado')?.setValue('');
    });
  }

  getError(controlName: string): string {
    const control = this.formGroup.get(controlName);
    if (!control || !control.errors || !control.touched) return '';
    return ValidationService.getErrorMessage(controlName, control.errors);
  }
}
