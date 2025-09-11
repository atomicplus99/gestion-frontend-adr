// components/selector-fecha/selector-fecha.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import { RegistroAsistenciaServiceManual } from '../../services/register-asistencia.service';


@Component({
  selector: 'app-selector-fecha',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 bg-blue-50 rounded-xl border border-blue-200">
      <h4 class="text-sm font-bold text-blue-800 mb-3">📅 Fecha de Registro</h4>
      
      <!-- Fecha actual vs personalizada -->
      <div class="flex items-center justify-between mb-3">
        <span class="text-sm font-medium text-blue-700">
          {{ esFechaHoy ? '📅 Hoy' : '📅 Fecha personalizada' }}
        </span>
        <button 
          type="button"
          (click)="toggleFechaPersonalizada()"
          class="text-xs px-3 py-1 rounded-full transition-colors"
          [ngClass]="{
            'bg-blue-600 text-white': usarFechaPersonalizada,
            'bg-blue-200 text-blue-700 hover:bg-blue-300': !usarFechaPersonalizada
          }">
          {{ usarFechaPersonalizada ? 'Usar hoy' : 'Personalizar' }}
        </button>
      </div>

      <!-- Campo de fecha -->
      <input
        type="date"
        [value]="fechaSeleccionada"
        (change)="onFechaChange($event)"
        [disabled]="!usarFechaPersonalizada"
        class="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded-lg transition-all"
        [class.bg-gray-100]="!usarFechaPersonalizada"
        [class.border-blue-500]="usarFechaPersonalizada"
      />

      <!-- Fechas rápidas -->
      <div *ngIf="usarFechaPersonalizada" class="mt-3 flex space-x-2">
        <button 
          type="button"
          (click)="establecerFechaRapida(-1)"
          class="text-xs px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors">
          Ayer
        </button>
        <button 
          type="button"
          (click)="establecerFechaRapida(0)"
          class="text-xs px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors">
          Hoy
        </button>
      </div>

      <!-- Información de la fecha -->
      <div class="mt-3 text-xs text-blue-600">
        <p>🔍 Buscará asistencia para: <strong>{{ fechaSeleccionada }}</strong></p>
      </div>
    </div>
  `
})
export class SelectorFechaComponent implements OnInit, OnDestroy {
  fechaSeleccionada: string = '';
  usarFechaPersonalizada = false;
  private destroy$ = new Subject<void>();

  constructor(private registroService: RegistroAsistenciaServiceManual) {}

  ngOnInit(): void {
    // Suscribirse a cambios en la fecha del servicio
    this.registroService.fechaSeleccionada$
      .pipe(takeUntil(this.destroy$))
      .subscribe(fecha => {
        this.fechaSeleccionada = fecha;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get esFechaHoy(): boolean {
    return this.registroService.esFechaHoy(this.fechaSeleccionada);
  }

  toggleFechaPersonalizada(): void {
    this.usarFechaPersonalizada = !this.usarFechaPersonalizada;
    
    if (!this.usarFechaPersonalizada) {
      // Volver a fecha de hoy
      this.registroService.setFechaSeleccionada(this.registroService.getFechaHoy());
    }
  }

  establecerFechaRapida(dias: number): void {
    // Usar el nuevo método que maneja la zona horaria de Perú
    const fechaStr = this.registroService.getFechaConDias(dias);

    this.registroService.setFechaSeleccionada(fechaStr);
  }

  onFechaChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const nuevaFecha = target.value;
    

    
    // Validar fecha antes de establecerla
    const validacion = this.registroService.validarFecha(nuevaFecha);
    
    if (!validacion.valida) {

      Swal.fire({
        icon: 'warning',
        title: 'Fecha Inválida',
        text: validacion.mensaje,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#f59e0b',
        timer: 4000
      });
      
      // Si la fecha es futura, resetear a hoy
      if (validacion.mensaje?.includes('futuras')) {
        const fechaHoy = this.registroService.getFechaHoy();

        this.registroService.setFechaSeleccionada(fechaHoy);
        return;
      }
    }
    

    this.registroService.setFechaSeleccionada(nuevaFecha);
  }
}