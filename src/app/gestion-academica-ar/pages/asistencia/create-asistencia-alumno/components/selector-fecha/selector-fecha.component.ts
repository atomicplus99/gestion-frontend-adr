// components/selector-fecha/selector-fecha.component.ts
import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
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
    <div class="p-4 bg-blue-50 rounded-lg border border-blue-200">
      <h4 class="text-sm font-semibold text-blue-800 mb-3">Fecha de Registro</h4>
      
      <!-- Fecha actual vs personalizada -->
      <div class="flex items-center justify-between mb-3">
        <span class="text-sm font-medium text-blue-700">
          {{ esFechaHoy ? 'Fecha actual' : 'Fecha personalizada' }}
        </span>
        <button 
          type="button"
          (click)="toggleFechaPersonalizada()"
          class="text-xs px-3 py-1 rounded-md transition-colors"
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
        [ngModel]="fechaSeleccionada"
        (ngModelChange)="onFechaChange($event)"
        [disabled]="!usarFechaPersonalizada"
        #fechaInput
        class="w-full px-3 py-2 text-sm border border-blue-300 rounded-md transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
        <!-- Botón de debug temporal -->
        <button 
          type="button"
          (click)="debugFecha()"
          class="text-xs px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors">
          Debug
        </button>
      </div>

      <!-- Información de la fecha -->
      <div class="mt-3 text-xs text-blue-600">
        <p>Buscará asistencia para: <strong>{{ fechaSeleccionada }}</strong></p>
      </div>
    </div>
  `
})
export class SelectorFechaComponent implements OnInit, OnDestroy {
  @ViewChild('fechaInput', { static: false }) fechaInput!: ElementRef<HTMLInputElement>;
  
  fechaSeleccionada: string = '';
  usarFechaPersonalizada = false;
  private destroy$ = new Subject<void>();

  constructor(
    private registroService: RegistroAsistenciaServiceManual,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Suscribirse a cambios en la fecha del servicio
    this.registroService.fechaSeleccionada$
      .pipe(takeUntil(this.destroy$))
      .subscribe(fecha => {
        console.log('🔄 [SELECTOR] Fecha actualizada desde servicio:', {
          fechaAnterior: this.fechaSeleccionada,
          fechaNueva: fecha
        });
        this.fechaSeleccionada = fecha;
        this.cdr.detectChanges(); // Forzar actualización de la UI
        
        // Forzar actualización del input después de un pequeño delay
        setTimeout(() => {
          this.forzarActualizacionInput();
        }, 100);
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
      const fechaHoy = this.registroService.getFechaHoy();
      console.log('🔄 [SELECTOR] Volviendo a fecha de hoy:', {
        usarFechaPersonalizada: this.usarFechaPersonalizada,
        fechaHoy,
        fechaActual: this.fechaSeleccionada
      });
      this.registroService.setFechaSeleccionada(fechaHoy);
      this.cdr.detectChanges(); // Forzar actualización inmediata
      
      // Forzar actualización del input después de un pequeño delay
      setTimeout(() => {
        this.forzarActualizacionInput();
      }, 100);
    }
  }

  private forzarActualizacionInput(): void {
    if (this.fechaInput && this.fechaInput.nativeElement) {
      console.log('🔧 [SELECTOR] Forzando actualización del input:', {
        valorAnterior: this.fechaInput.nativeElement.value,
        valorNuevo: this.fechaSeleccionada
      });
      
      // Forzar la actualización del valor del input
      this.fechaInput.nativeElement.value = this.fechaSeleccionada;
      
      // Disparar evento de cambio para sincronizar
      this.fechaInput.nativeElement.dispatchEvent(new Event('input', { bubbles: true }));
      this.fechaInput.nativeElement.dispatchEvent(new Event('change', { bubbles: true }));
      
      this.cdr.detectChanges();
    }
  }

  establecerFechaRapida(dias: number): void {
    // Usar el nuevo método que maneja la zona horaria de Perú
    const fechaStr = this.registroService.getFechaConDias(dias);
    
    console.log('📅 [SELECTOR] Estableciendo fecha rápida:', {
      dias,
      fechaStr,
      fechaActual: this.fechaSeleccionada
    });

    this.registroService.setFechaSeleccionada(fechaStr);
    this.cdr.detectChanges(); // Forzar actualización inmediata
    
    // Forzar actualización del input después de un pequeño delay
    setTimeout(() => {
      this.forzarActualizacionInput();
    }, 100);
  }

  onFechaChange(nuevaFecha: string): void {
    console.log('📅 [SELECTOR] Cambio de fecha:', {
      nuevaFecha,
      fechaActual: this.fechaSeleccionada
    });
    
    // Validar fecha antes de establecerla
    const validacion = this.registroService.validarFecha(nuevaFecha);
    
    if (!validacion.valida) {
      console.log('❌ [SELECTOR] Fecha inválida:', validacion.mensaje);
      
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
        console.log('🔄 [SELECTOR] Reseteando a fecha de hoy:', fechaHoy);
        this.registroService.setFechaSeleccionada(fechaHoy);
        return;
      }
    }
    
    console.log('✅ [SELECTOR] Estableciendo nueva fecha:', nuevaFecha);
    this.registroService.setFechaSeleccionada(nuevaFecha);
  }

  // Método temporal para debug
  debugFecha(): void {
    console.log('🐛 [DEBUG] Estado actual:', {
      fechaSeleccionada: this.fechaSeleccionada,
      usarFechaPersonalizada: this.usarFechaPersonalizada,
      esFechaHoy: this.esFechaHoy
    });
    
    // Forzar fecha específica para debug
    this.registroService.setFechaDebug('2025-09-14');
    this.cdr.detectChanges();
  }
}