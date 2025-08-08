import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup } from '@angular/forms';
import { FormValidationService } from '../../services/form-validation.service';


@Component({
  selector: 'app-form-status',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mb-6 p-4 bg-gray-50 rounded-xl">
      <h4 class="text-sm font-bold text-gray-800 mb-3">Estado del Formulario</h4>
      <div class="grid grid-cols-2 gap-3 text-xs">
        <div class="flex items-center space-x-2">
          <div [ngClass]="validationService.getValidationClass(form.get('hora_de_llegada'))"></div>
          <span class="font-medium">Llegada</span>
        </div>
        <div class="flex items-center space-x-2">
          <div [ngClass]="validationService.getValidationClass(form.get('hora_salida'), true)"></div>
          <span class="font-medium">Salida</span>
        </div>
        <div class="flex items-center space-x-2">
          <div [ngClass]="validationService.getValidationClass(form.get('estado_asistencia'))"></div>
          <span class="font-medium">Estado</span>
        </div>
        <div class="flex items-center space-x-2">
          <div [ngClass]="validationService.getValidationClass(form.get('motivo'))"></div>
          <span class="font-medium">Motivo</span>
        </div>
      </div>
    </div>
  `
})
export class FormStatusComponent {
  @Input() form!: FormGroup;

  constructor(public validationService: FormValidationService) {}
}