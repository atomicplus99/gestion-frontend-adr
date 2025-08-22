import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup } from '@angular/forms';
import { FormValidationService } from '../../services/form-validation.service';


@Component({
  selector: 'app-form-status',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
      <div class="flex items-center">
        <svg class="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span class="text-sm text-blue-700 font-medium">Formulario listo para registro</span>
      </div>
    </div>
  `
})
export class FormStatusComponent {
  @Input() form!: FormGroup;

  constructor(public validationService: FormValidationService) {}
}