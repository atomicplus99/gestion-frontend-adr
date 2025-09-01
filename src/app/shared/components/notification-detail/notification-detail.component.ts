import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { NotificacionesService } from '../../services/notificaciones.service';
import { WebSocketService } from '../../services/websocket.service';
import { Notificacion } from '../../interfaces/notificaciones.interface';

@Component({
  selector: 'app-notification-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-detail.component.html',
  styleUrls: ['./notification-detail.component.css']
})
export class NotificationDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  notificacion = signal<Notificacion | null>(null);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private notificacionesService: NotificacionesService,
    private webSocketService: WebSocketService
  ) {}

  ngOnInit(): void {
    this.loadNotification();
    this.setupWebSocketListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupWebSocketListeners(): void {
    // Escuchar notificaciones marcadas como leídas en tiempo real
    this.webSocketService.notificacionMarcadaLeida$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        const currentNotificacion = this.notificacion();
        if (currentNotificacion && currentNotificacion.id === data.id) {
          // Actualizar la notificación actual si es la que se marcó como leída
          this.notificacion.set({
            ...currentNotificacion,
            estado: 'leida',
            fecha_lectura: data.fecha_lectura
          });
        }
      });
  }

  private loadNotification(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('ID de notificación no válido');
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    this.notificacionesService.obtenerNotificacionPorId(id)
      .subscribe({
        next: (notificacion) => {
          this.notificacion.set(notificacion);
          this.isLoading.set(false);
        },
        error: (error) => {
          this.error.set('Error al cargar la notificación');
          this.isLoading.set(false);
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/home/welcome']);
  }

  markAsRead(): void {
    const notificacion = this.notificacion();
    if (!notificacion || notificacion.estado === 'leida') {
      return;
    }

    this.notificacionesService.marcarComoLeida(notificacion.id)
      .subscribe({
        next: () => {
          // Actualizar el estado local
          const currentNotificacion = this.notificacion();
          if (currentNotificacion) {
            this.notificacion.set({
              ...currentNotificacion,
              estado: 'leida',
              fecha_lectura: new Date().toISOString()
            });
          }
          // El cache se maneja automáticamente en el servicio
        },
        error: (error) => {
          // Manejar error si es necesario
        }
      });
  }

  getIconoTipo(tipo: string): string {
    return this.notificacionesService.getIconoTipo(tipo as any);
  }

  getClaseTipo(tipo: string): string {
    return this.notificacionesService.getClaseTipo(tipo as any);
  }

  getClasePrioridad(prioridad: string): string {
    return this.notificacionesService.getClasePrioridad(prioridad);
  }

  formatearFecha(fecha: string): string {
    return this.notificacionesService.formatearFechaNotificacion(fecha);
  }

  getTipoDescripcion(tipo: string): string {
    switch (tipo) {
      case 'SCHEDULER':
        return 'Programación automática';
      case 'JUSTIFICACION':
        return 'Justificaciones';
      case 'SISTEMA':
        return 'Sistema';
      default:
        return 'General';
    }
  }

  getPrioridadDescripcion(prioridad: string): string {
    switch (prioridad) {
      case 'ALTA':
        return 'Alta prioridad';
      case 'MEDIA':
        return 'Prioridad media';
      case 'BAJA':
        return 'Baja prioridad';
      default:
        return 'Normal';
    }
  }
}
