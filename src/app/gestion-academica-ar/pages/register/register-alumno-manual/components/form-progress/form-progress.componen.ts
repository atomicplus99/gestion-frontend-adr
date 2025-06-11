
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormProgress } from '../../interfaces/AlumnoRegister.interface';


@Component({
  selector: 'app-form-progress',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mb-8">
      <div class="flex justify-between mb-1">
        <span class="text-sm font-medium text-purple-600">Completar formulario</span>
        <span class="text-sm font-medium text-purple-600" [innerHTML]="progress.message"></span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2.5">
        <div class="bg-purple-600 h-2.5 rounded-full transition-all duration-500" 
             [style.width.%]="progress.percent"
             [class.bg-green-500]="progress.isComplete"></div>
      </div>
    </div>
  `
})
export class FormProgressComponent {
  @Input() progress: FormProgress = { percent: 0, message: '0% completado', isComplete: false };
}