import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { NotificacionesService } from '../../services/notificaciones.service';
import { WebSocketService } from '../../services/websocket.service';
import { 
  Notificacion, 
  ContadorNotificaciones, 
  NotificacionesQueryParams,
  TipoNotificacion,
  EstadoNotificacion
} from '../../interfaces/notificaciones.interface';

@Component({
  selector: 'app-notifications-bell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications-bell.component.html',
  styleUrls: ['./notifications-bell.component.css']
})
export class NotificationsBellComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Estados del componente
  isOpen = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  isMarkingAsRead = signal<boolean>(false);
  
  // Datos del componente
  notificaciones = signal<Notificacion[]>([]);
  contador = signal<ContadorNotificaciones>({
    total_no_leidas: 0,
    por_tipo: { SCHEDULER: 0, JUSTIFICACION: 0, SISTEMA: 0 }
  });
  
  // Paginación
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  totalItems = signal<number>(0);
  itemsPerPage = signal<number>(10);
  
  // Filtros
  selectedTipo = signal<TipoNotificacion | 'TODAS'>('TODAS');
  selectedEstado = signal<string>('no_leida');
  
  // WebSocket
  isWebSocketConnected = signal<boolean>(false);
  
  // Computed properties
  hasUnreadNotifications = computed(() => this.contador().total_no_leidas > 0);
  unreadCount = computed(() => this.contador().total_no_leidas);
  
  // Opciones de filtro
  tipoOptions = [
    { value: 'TODAS', label: 'Todos los tipos' },
    { value: 'SCHEDULER', label: 'Scheduler' },
    { value: 'JUSTIFICACION', label: 'Justificaciones' },
    { value: 'SISTEMA', label: 'Sistema' }
  ];
  
  estadoOptions = [
    { value: 'no_leida', label: 'No leídas' }
  ];

  constructor(
    private notificacionesService: NotificacionesService,
    private webSocketService: WebSocketService,
    private router: Router
  ) {
  }

  ngOnInit(): void {
    this.initializeComponent();
    this.setupSubscriptions();
    this.connectWebSocket();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.webSocketService.disconnect();
  }

  /**
   * Inicializa el componente
   */
  private initializeComponent(): void {
    this.loadNotificaciones();
    this.loadContador();
  }

  /**
   * Configura las suscripciones
   */
  private setupSubscriptions(): void {
    // Suscribirse a notificaciones del servicio
    this.notificacionesService.notificaciones$
      .pipe(takeUntil(this.destroy$))
      .subscribe(notificaciones => {
        this.notificaciones.set(notificaciones);
      });

    // Suscribirse al contador del servicio
    this.notificacionesService.contador$
      .pipe(takeUntil(this.destroy$))
      .subscribe(contador => {
        this.contador.set(contador);
      });

    // Suscribirse a nuevas notificaciones del WebSocket
    this.webSocketService.nuevaNotificacion$
      .pipe(takeUntil(this.destroy$))
      .subscribe(notificacion => {
        this.notificacionesService.agregarNuevaNotificacion(notificacion);
        this.loadContador(); // Actualizar contador
        this.vibrarDispositivo(); // Vibrar cuando llegue una nueva notificación
      });

    // Suscribirse a notificaciones marcadas como leídas en tiempo real
    this.webSocketService.notificacionMarcadaLeida$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.notificacionesService.handleNotificacionMarcadaLeidaEnTiempoReal(data.id, data.fecha_lectura);
        this.loadContador(); // Actualizar contador
      });

    // Suscribirse al estado de conexión WebSocket
    this.webSocketService.connectionStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe(connected => {
        this.isWebSocketConnected.set(connected);
      });

    // Suscribirse a errores del WebSocket
    this.webSocketService.error$
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => {
        // Aquí podrías mostrar una notificación de error al usuario
      });
  }

  /**
   * Conecta al WebSocket
   */
  private connectWebSocket(): void {
    this.webSocketService.connect();
  }

  /**
   * Carga las notificaciones (solo NO LEÍDAS)
   */
  loadNotificaciones(): void {
    this.isLoading.set(true);
    
    const params: NotificacionesQueryParams = {
      page: this.currentPage(),
      limit: this.itemsPerPage(),
      tipo: this.selectedTipo() !== 'TODAS' ? this.selectedTipo() as TipoNotificacion : undefined,
      estado: 'no_leida' // Solo cargar notificaciones NO LEÍDAS
    };
    
    this.notificacionesService.obtenerNotificaciones(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Filtrar solo las NO LEÍDAS por seguridad
          const notificacionesNoLeidas = response.notificaciones.filter(n => n.estado === 'no_leida');
          this.notificaciones.set(notificacionesNoLeidas);
          this.totalPages.set(response.pagination.totalPages);
          this.totalItems.set(notificacionesNoLeidas.length);
          this.isLoading.set(false);
        },
        error: (error) => {
          this.isLoading.set(false);
        }
      });
  }

  /**
   * Carga el contador de notificaciones
   */
  loadContador(): void {
    this.notificacionesService.obtenerContador()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (contador) => {
          this.contador.set(contador);
        },
        error: (error) => {
        }
      });
  }

  /**
   * Alterna la visibilidad del dropdown
   */
  toggleDropdown(): void {
    const newState = !this.isOpen();
    this.isOpen.set(newState);
    
    if (newState) {
      this.loadNotificaciones();
    }
  }

  /**
   * Cierra el dropdown
   */
  closeDropdown(): void {
    this.isOpen.set(false);
  }

  /**
   * Navega a los detalles de la notificación (sin marcar como leída)
   */
  viewNotificationDetails(notificacion: Notificacion): void {
    this.router.navigate(['/home/notifications', notificacion.id]);
  }

  /**
   * Marca una notificación como leída
   */
  markAsRead(notificacion: Notificacion): void {
    if (notificacion.estado === 'leida') {
      return;
    }
    
    this.isMarkingAsRead.set(true);
    
    this.notificacionesService.marcarComoLeida(notificacion.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isMarkingAsRead.set(false);
          this.loadContador(); // Actualizar contador
          // El cache se maneja automáticamente en el servicio
        },
        error: (error) => {
          this.isMarkingAsRead.set(false);
        }
      });
  }

  /**
   * Cambia el filtro de tipo
   */
  onTipoChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const tipo = target.value as TipoNotificacion | 'TODAS';
    this.selectedTipo.set(tipo);
    this.currentPage.set(1); // Reset a la primera página
    this.loadNotificaciones();
  }

  /**
   * Cambia el filtro de estado (solo permite no_leida)
   */
  onEstadoChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const estado = target.value as string;
    // Solo permitir no_leida
    if (estado === 'no_leida') {
      this.selectedEstado.set(estado as any);
      this.currentPage.set(1); // Reset a la primera página
      this.loadNotificaciones();
    }
  }

  /**
   * Cambia de página
   */
  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadNotificaciones();
  }

  /**
   * Obtiene el icono para el tipo de notificación
   */
  getIconoTipo(tipo: string): string {
    return this.notificacionesService.getIconoTipo(tipo as TipoNotificacion);
  }

  /**
   * Obtiene la clase CSS para el tipo de notificación
   */
  getClaseTipo(tipo: string): string {
    return this.notificacionesService.getClaseTipo(tipo as TipoNotificacion);
  }

  /**
   * Formatea la fecha de una notificación
   */
  formatearFecha(fecha: string): string {
    return this.notificacionesService.formatearFechaNotificacion(fecha);
  }

  /**
   * Genera un array de páginas para la paginación
   */
  get paginas(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    
    // Mostrar máximo 5 páginas
    const start = Math.max(1, current - 2);
    const end = Math.min(total, start + 4);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  /**
   * Verifica si hay notificaciones para mostrar (solo NO LEÍDAS)
   */
  get hasNotifications(): boolean {
    return this.notificaciones().filter(n => n.estado === 'no_leida').length > 0;
  }

  /**
   * Obtiene solo las notificaciones NO LEÍDAS
   */
  get notificacionesNoLeidas(): Notificacion[] {
    return this.notificaciones().filter(n => n.estado === 'no_leida');
  }

  /**
   * Obtiene el texto del estado de conexión WebSocket
   */
  get webSocketStatusText(): string {
    return this.isWebSocketConnected() ? 'Conectado' : 'Desconectado';
  }

  /**
   * Obtiene la clase CSS del estado de conexión WebSocket
   */
  get webSocketStatusClass(): string {
    return this.isWebSocketConnected() ? 'text-green-600' : 'text-red-600';
  }

  /**
   * Vibra el dispositivo cuando llega una nueva notificación
   */
  private vibrarDispositivo(): void {
    // Verificar si el navegador soporta la API de vibración
    if ('vibrate' in navigator) {
      // Vibración corta para notificación
      navigator.vibrate(200);
    }
  }

  /**
   * Función trackBy para optimizar el rendimiento del *ngFor
   */
  trackByNotificacionId(index: number, notificacion: Notificacion): string {
    return notificacion.id;
  }
}
