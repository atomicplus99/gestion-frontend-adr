import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-date-info',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
      <p class="text-sm text-blue-800">
        <strong>📅 Registrando para:</strong> {{ esFechaHoy ? 'Hoy (' + fechaSeleccionada + ')' : fechaSeleccionada }}
      </p>
      <p class="text-xs text-blue-600 mt-1">
        La fecha se registrará con la {{ form.get('hora_salida')?.value ? 'hora de salida' : 'hora de llegada' }}
      </p>
    </div>
  `
})
export class DateInfoComponent {
  @Input() fechaSeleccionada: string = '';
  @Input() esFechaHoy: boolean = false;
  @Input() form!: FormGroup;
}