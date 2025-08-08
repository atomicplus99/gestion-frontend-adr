import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SchedulerService } from '../../services/scheduler.service';
import { ActualizarConfiguracion, ConfiguracionScheduler, ResultadoEjecucion } from '../../interfaces/SchedulerAdmin.interface';

interface FormDataInterface {
  turnoManana: {
    hora: string;
    activo: boolean;
  };
  turnoTarde: {
    hora: string;
    activo: boolean;
  };
  notificacionesActivas: boolean;
}

@Component({
  selector: 'app-scheduler-ausencias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './scheduler.component.html'
})
export class SchedulerAusenciasComponent implements OnInit {
  private schedulerService = inject(SchedulerService);
  
  configuracion = signal<ConfiguracionScheduler | null>(null);
  cargando = signal(false);
  ejecutando = signal(false);
  ultimoResultado = signal<ResultadoEjecucion | null>(null);
  mensaje = signal<{ texto: string } | null>(null);
  
  // Modal de confirmación simple
  mostrarConfirmacionModal = false;
  turnoSeleccionado: 'manana' | 'tarde' = 'manana';

  formData: FormDataInterface = {
    turnoManana: { hora: '12:45', activo: true },
    turnoTarde: { hora: '18:20', activo: true },
    notificacionesActivas: true
  };

  ngOnInit(): void {
    this.cargarConfiguracion();
  }

  cargarConfiguracion(): void {
    this.cargando.set(true);
    this.schedulerService.getConfiguracion().subscribe({
      next: (config: ConfiguracionScheduler) => {
        this.configuracion.set(config);
        this.formData = {
          turnoManana: {
            hora: config.turnoMañana?.hora || '12:45',
            activo: config.turnoMañana?.activo ?? true
          },
          turnoTarde: {
            hora: config.turnoTarde?.hora || '18:20',
            activo: config.turnoTarde?.activo ?? true
          },
          notificacionesActivas: config.configuracionGeneral?.notificacionesActivas ?? true
        };
        this.cargando.set(false);
        this.mostrarMensaje('Configuración cargada correctamente');
      },
      error: (error: any) => {
        console.error('Error:', error);
        this.cargando.set(false);
        this.mostrarMensaje('Error al cargar la configuración');
      }
    });
  }

  actualizarConfiguracion(): void {
    this.cargando.set(true);
    
    const payload: ActualizarConfiguracion = {
      turnoMañana: {
        hora: this.formData.turnoManana.hora,
        activo: this.formData.turnoManana.activo
      },
      turnoTarde: {
        hora: this.formData.turnoTarde.hora,
        activo: this.formData.turnoTarde.activo
      },
      notificacionesActivas: this.formData.notificacionesActivas
    };

    this.schedulerService.actualizarConfiguracion(payload).subscribe({
      next: (response: any) => {
        this.configuracion.set(response.configuracion);
        this.cargando.set(false);
        this.mostrarMensaje('Configuración actualizada correctamente');
      },
      error: (error: any) => {
        console.error('Error:', error);
        this.cargando.set(false);
        this.mostrarMensaje('Error al actualizar la configuración');
      }
    });
  }

  // Métodos para el modal de confirmación simple
  mostrarConfirmacion(turno: 'manana' | 'tarde'): void {
    this.turnoSeleccionado = turno;
    this.mostrarConfirmacionModal = true;
  }

  cerrarConfirmacion(): void {
    this.mostrarConfirmacionModal = false;
  }

  confirmarProcesamiento(): void {
    this.mostrarConfirmacionModal = false;
    this.ejecutarManual(this.turnoSeleccionado);
  }

  ejecutarManual(turno: 'manana' | 'tarde'): void {
    this.ejecutando.set(true);
    
    // Mapeo para la API que espera 'mañana'
    const turnoApi = turno === 'manana' ? 'mañana' : 'tarde';
    
    this.schedulerService.ejecutarManual(turnoApi).subscribe({
      next: (resultado: ResultadoEjecucion) => {
        this.ultimoResultado.set(resultado);
        this.ejecutando.set(false);
        const turnoTexto = turno === 'manana' ? 'Turno Mañana' : 'Turno Tarde';
        this.mostrarMensaje(`Procesamiento de ausencias del ${turnoTexto} completado exitosamente`);
      },
      error: (error: any) => {
        console.error('Error:', error);
        this.ejecutando.set(false);
        const turnoTexto = turno === 'manana' ? 'Turno Mañana' : 'Turno Tarde';
        this.mostrarMensaje(`Error en el procesamiento de ausencias del ${turnoTexto}`);
      }
    });
  }

  healthCheck(): void {
    this.schedulerService.healthCheck().subscribe({
      next: (response: any) => {
        this.mostrarMensaje(`Estado del sistema: ${response.status}`);
      },
      error: (error: any) => {
        console.error('Error:', error);
        this.mostrarMensaje('Error al verificar el estado del sistema');
      }
    });
  }

  private mostrarMensaje(texto: string): void {
    this.mensaje.set({ texto });
    setTimeout(() => {
      this.mensaje.set(null);
    }, 5000);
  }
}