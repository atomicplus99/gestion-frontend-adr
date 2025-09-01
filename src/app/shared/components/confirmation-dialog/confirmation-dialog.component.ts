import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ConfirmationDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info';
  show: boolean;
}

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="data.show" 
         class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
         (click)="onBackgroundClick($event)">
      
      <div class="relative w-full max-w-md transform transition-all duration-300"
           [class.scale-95]="!data.show"
           [class.scale-100]="data.show">
        
        <!-- Modal de Confirmación -->
        <div class="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
          
          <!-- Header -->
          <div class="px-6 py-4 border-b border-gray-200"
               [ngClass]="{
                 'bg-gradient-to-r from-yellow-500 to-orange-600': data.type === 'warning',
                 'bg-gradient-to-r from-red-500 to-pink-600': data.type === 'danger',
                 'bg-gradient-to-r from-blue-500 to-indigo-600': data.type === 'info' || !data.type
               }">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <svg *ngIf="data.type === 'warning'" class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
                <svg *ngIf="data.type === 'danger'" class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
                <svg *ngIf="data.type === 'info' || !data.type" class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h3 class="text-xl font-bold text-white">{{ data.title }}</h3>
            </div>
          </div>
          
          <!-- Contenido -->
          <div class="px-6 py-6">
            <p class="text-gray-700 text-lg mb-6 leading-relaxed">{{ data.message }}</p>
            
            <!-- Botones de acción -->
            <div class="flex space-x-3">
              <!-- Botón Cancelar -->
              <button (click)="onCancel()"
                      class="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all duration-300 hover:scale-105">
                {{ data.cancelText || 'Cancelar' }}
              </button>
              
              <!-- Botón Confirmar -->
              <button (click)="onConfirm()"
                      class="flex-1 px-4 py-3 font-semibold rounded-xl transition-all duration-300 hover:scale-105"
                      [ngClass]="{
                        'bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white': data.type === 'warning',
                        'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white': data.type === 'danger',
                        'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white': data.type === 'info' || !data.type
                      }">
                {{ data.confirmText || 'Confirmar' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class ConfirmationDialogComponent {
  @Input() data: ConfirmationDialogData = {
    title: '',
    message: '',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    type: 'warning',
    show: false
  };
  
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  
  onConfirm(): void {
    this.confirm.emit();
  }
  
  onCancel(): void {
    this.cancel.emit();
  }
  
  onBackgroundClick(event: Event): void {
    // Solo cerrar si se hace clic en el fondo, no en el modal
    if (event.target === event.currentTarget) {
      this.onCancel();
    }
  }
}
