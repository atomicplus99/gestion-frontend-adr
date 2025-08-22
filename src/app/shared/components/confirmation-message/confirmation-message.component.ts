import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ConfirmationMessage {
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  details?: string[];
  show: boolean;
}

@Component({
  selector: 'app-confirmation-message',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="message.show" 
         class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
         (click)="onBackgroundClick($event)">
      
      <div class="relative w-full max-w-md transform transition-all duration-300"
           [class.scale-95]="!message.show"
           [class.scale-100]="message.show">
        
        <!-- Mensaje de Éxito -->
        <div *ngIf="message.type === 'success'" 
             class="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl shadow-2xl overflow-hidden">
          
          <!-- Header con gradiente verde -->
          <div class="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 class="text-xl font-bold text-white">{{ message.title }}</h3>
            </div>
          </div>
          
          <!-- Contenido -->
          <div class="px-6 py-6">
            <p class="text-green-800 text-lg mb-4">{{ message.message }}</p>
            
            <!-- Detalles si existen -->
            <div *ngIf="message.details && message.details.length > 0" class="space-y-2">
              <div *ngFor="let detail of message.details" 
                   class="flex items-center space-x-2 text-green-700">
                <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                <span class="text-sm">{{ detail }}</span>
              </div>
            </div>
            
            <!-- Botón de confirmación -->
            <button (click)="onConfirm()"
                    class="w-full mt-6 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg">
              Continuar
            </button>
          </div>
        </div>
        
        <!-- Mensaje de Error -->
        <div *ngIf="message.type === 'error'" 
             class="bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 rounded-2xl shadow-2xl overflow-hidden">
          
          <!-- Header con gradiente rojo -->
          <div class="bg-gradient-to-r from-red-500 to-pink-600 px-6 py-4">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
              <h3 class="text-xl font-bold text-white">{{ message.title }}</h3>
            </div>
          </div>
          
          <!-- Contenido -->
          <div class="px-6 py-6">
            <p class="text-red-800 text-lg mb-4">{{ message.message }}</p>
            
            <!-- Botón de confirmación -->
            <button (click)="onConfirm()"
                    class="w-full mt-6 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg">
              Entendido
            </button>
          </div>
        </div>
        
        <!-- Mensaje de Información -->
        <div *ngIf="message.type === 'info'" 
             class="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl shadow-2xl overflow-hidden">
          
          <!-- Header con gradiente azul -->
          <div class="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h3 class="text-xl font-bold text-white">{{ message.title }}</h3>
            </div>
          </div>
          
          <!-- Contenido -->
          <div class="px-6 py-6">
            <p class="text-blue-800 text-lg mb-4">{{ message.message }}</p>
            
            <!-- Botón de confirmación -->
            <button (click)="onConfirm()"
                    class="w-full mt-6 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg">
              Entendido
            </button>
          </div>
        </div>
        
        <!-- Mensaje de Advertencia -->
        <div *ngIf="message.type === 'warning'" 
             class="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl shadow-2xl overflow-hidden">
          
          <!-- Header con gradiente amarillo -->
          <div class="bg-gradient-to-r from-yellow-500 to-orange-600 px-6 py-4">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
              </div>
              <h3 class="text-xl font-bold text-white">{{ message.title }}</h3>
            </div>
          </div>
          
          <!-- Contenido -->
          <div class="px-6 py-6">
            <p class="text-yellow-800 text-lg mb-4">{{ message.message }}</p>
            
            <!-- Botón de confirmación -->
            <button (click)="onConfirm()"
                    class="w-full mt-6 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg">
              Entendido
            </button>
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
export class ConfirmationMessageComponent {
  @Input() message: ConfirmationMessage = {
    type: 'info',
    title: '',
    message: '',
    show: false
  };
  
  @Output() confirm = new EventEmitter<void>();
  
  onConfirm(): void {
    this.confirm.emit();
  }
  
  onBackgroundClick(event: Event): void {
    // Solo cerrar si se hace clic en el fondo, no en el modal
    if (event.target === event.currentTarget) {
      this.onConfirm();
    }
  }
}
