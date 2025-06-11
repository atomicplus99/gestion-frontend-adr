import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ValidationService } from '../../services/validation.service';

@Component({
  selector: 'app-personal-info-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PersonalInfoFormComponent),
      multi: true
    }
  ],
  template: `
    <div class="bg-gray-50 p-6 rounded-xl border border-gray-100">
      <h3 class="text-lg font-semibold mb-4 text-gray-700 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        Información Personal
      </h3>
      
      <div [formGroup]="formGroup">
        <!-- Fila: Código, Nombre y Apellido -->
        <div class="grid md:grid-cols-3 gap-6">
          <div>
            <label class="block text-sm font-semibold mb-1 text-gray-700">Código</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
              </div>
              <input type="text" formControlName="codigo"
                class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition-colors" 
                placeholder="14 dígitos" />
            </div>
            <p class="text-sm text-red-500 mt-1" *ngIf="getError('codigo')">{{ getError('codigo') }}</p>
          </div>

          <div>
            <label class="block text-sm font-semibold mb-1 text-gray-700">Nombre</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input type="text" formControlName="nombre"
                class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition-colors" 
                placeholder="Ingrese nombre" />
            </div>
            <p class="text-sm text-red-500 mt-1" *ngIf="getError('nombre')">{{ getError('nombre') }}</p>
          </div>

          <div>
            <label class="block text-sm font-semibold mb-1 text-gray-700">Apellido</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input type="text" formControlName="apellido"
                class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition-colors" 
                placeholder="Ingrese apellido" />
            </div>
            <p class="text-sm text-red-500 mt-1" *ngIf="getError('apellido')">{{ getError('apellido') }}</p>
          </div>
        </div>

        <!-- Fila: Fecha y DNI -->
        <div class="grid md:grid-cols-2 gap-6 mt-6">
          <div>
            <label class="block text-sm font-semibold mb-1 text-gray-700">Fecha de nacimiento</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <input type="date" formControlName="fechaNacimiento"
                class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition-colors" />
            </div>
            <p class="text-sm text-red-500 mt-1" *ngIf="getError('fechaNacimiento')">{{ getError('fechaNacimiento') }}</p>
          </div>

          <div>
            <label class="block text-sm font-semibold mb-1 text-gray-700">DNI</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                </svg>
              </div>
              <input type="text" formControlName="dni"
                class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition-colors"
                placeholder="8 dígitos" />
            </div>
            <p class="text-sm text-red-500 mt-1" *ngIf="getError('dni')">{{ getError('dni') }}</p>
          </div>
        </div>

        <!-- Dirección -->
        <div class="mt-6">
          <label class="block text-sm font-semibold mb-1 text-gray-700">Dirección</label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <input type="text" formControlName="direccion"
              class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition-colors"
              placeholder="Dirección completa" />
          </div>
          <p class="text-sm text-red-500 mt-1" *ngIf="getError('direccion')">{{ getError('direccion') }}</p>
        </div>
      </div>
    </div>
  `
})
export class PersonalInfoFormComponent implements ControlValueAccessor {
  @Input() formGroup!: FormGroup;

  onChange = (value: any) => {};
  onTouched = () => {};

  writeValue(value: any): void {}
  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }

  getError(controlName: string): string {
    const control = this.formGroup.get(controlName);
    if (!control || !control.errors || !control.touched) return '';
    return ValidationService.getErrorMessage(controlName, control.errors);
  }
}