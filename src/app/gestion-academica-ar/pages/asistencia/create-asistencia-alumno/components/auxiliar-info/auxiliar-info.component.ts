import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auxiliar-info',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="idAuxiliar" class="mb-6 p-3 bg-green-50 rounded-lg border border-green-200">
      <p class="text-sm text-green-800">
        <strong>👤 Auxiliar:</strong> {{ nombreAuxiliar }}
      </p>
    </div>
  `
})
export class AuxiliarInfoComponent {
  @Input() idAuxiliar: string | null = null;
  @Input() nombreAuxiliar: string = '';
}