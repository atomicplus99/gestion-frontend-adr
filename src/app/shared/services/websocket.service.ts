import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { Notificacion, WebSocketNotificationEvent } from '../interfaces/notificaciones.interface';
import { AusenciaProgramada } from '../../gestion-academica-ar/pages/ausencias-masivas/interfaces/ausencias-masivas.interface';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService implements OnDestroy {
  private socket: Socket | null = null;
  private readonly wsUrl = 'wss://localhost:443';
  
  // Subjects para eventos WebSocket
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  private nuevaNotificacionSubject = new Subject<Notificacion>();
  private notificacionMarcadaLeidaSubject = new Subject<{ id: string; fecha_lectura: string }>();
  private errorSubject = new Subject<string>();
  
  // Subjects para eventos de ausencias masivas
  private ausenciaProgramadaSubject = new Subject<AusenciaProgramada>();
  private ausenciaCanceladaSubject = new Subject<{ id: string; fecha_cancelacion: string }>();
  
  // Nuevos subjects para eventos de programación
  private programacionCreadaSubject = new Subject<{
    programacion: AusenciaProgramada;
    historial: any[];
    programadas: AusenciaProgramada[];
    timestamp: string;
  }>();
  private programacionCanceladaSubject = new Subject<{
    programacion_id: string;
    historial: any[];
    programadas: AusenciaProgramada[];
    timestamp: string;
  }>();
  
  // Observables públicos
  public connectionStatus$ = this.connectionStatusSubject.asObservable();
  public nuevaNotificacion$ = this.nuevaNotificacionSubject.asObservable();
  public notificacionMarcadaLeida$ = this.notificacionMarcadaLeidaSubject.asObservable();
  public error$ = this.errorSubject.asObservable();
  
  // Observables públicos para ausencias masivas
  public ausenciaProgramada$ = this.ausenciaProgramadaSubject.asObservable();
  public ausenciaCancelada$ = this.ausenciaCanceladaSubject.asObservable();
  
  // Nuevos observables públicos para eventos de programación
  public programacionCreada$ = this.programacionCreadaSubject.asObservable();
  public programacionCancelada$ = this.programacionCanceladaSubject.asObservable();
  
  // Estado de conexión
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000; // 5 segundos

  constructor() {
  }

  /**
   * Conecta al servidor WebSocket
   */
  connect(): void {
    if (this.socket && this.socket.connected) {
      return;
    }
    
    try {
      this.socket = io(this.wsUrl, {
        transports: ['websocket'],
        timeout: 10000,
        forceNew: true
      });

      this.setupEventListeners();
      
    } catch (error) {
      this.errorSubject.next('Error al conectar con el servidor de notificaciones');
    }
  }

  /**
   * Desconecta del servidor WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.connectionStatusSubject.next(false);
    }
  }

  /**
   * Configura los event listeners del WebSocket
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Evento de conexión exitosa
    this.socket.on('connect', () => {
      this.isConnected = true;
      this.connectionStatusSubject.next(true);
      this.reconnectAttempts = 0;
      
      // Suscribirse a notificaciones globales
      this.subscribeToGlobalNotifications();
    });

    // Evento de desconexión
    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      this.connectionStatusSubject.next(false);
      
      // Intentar reconectar si no fue una desconexión intencional
      if (reason !== 'io client disconnect') {
        this.attemptReconnect();
      }
    });

    // Evento de error de conexión
    this.socket.on('connect_error', (error) => {
      this.errorSubject.next('Error de conexión con el servidor de notificaciones');
      this.attemptReconnect();
    });

    // Evento de nueva notificación
    this.socket.on('new_notification', (data: WebSocketNotificationEvent) => {
      this.nuevaNotificacionSubject.next(data.notificacion);
    });

    // Evento de notificación marcada como leída
    this.socket.on('notification_marked_read', (data: { id: string; fecha_lectura: string }) => {
      this.notificacionMarcadaLeidaSubject.next(data);
    });

    // Eventos de ausencias masivas
    this.socket.on('ausencia_programada', (data: AusenciaProgramada) => {
      this.ausenciaProgramadaSubject.next(data);
    });

    this.socket.on('ausencia_cancelada', (data: { id: string; fecha_cancelacion: string }) => {
      this.ausenciaCanceladaSubject.next(data);
    });

    // Nuevos eventos de programación
    this.socket.on('programacion_creada', (data: {
      programacion: AusenciaProgramada;
      historial: any[];
      programadas: AusenciaProgramada[];
      timestamp: string;
    }) => {
      this.programacionCreadaSubject.next(data);
    });

    this.socket.on('programacion_cancelada', (data: {
      programacion_id: string;
      historial: any[];
      programadas: AusenciaProgramada[];
      timestamp: string;
    }) => {
      this.programacionCanceladaSubject.next(data);
    });

    // Evento de suscripción exitosa
    this.socket.on('subscribed_global', () => {
    });

    // Evento de error general
    this.socket.on('error', (error) => {
      this.errorSubject.next('Error en el servidor de notificaciones');
    });
  }

  /**
   * Se suscribe a notificaciones globales
   */
  private subscribeToGlobalNotifications(): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('subscribe_global');
    }
  }

  /**
   * Intenta reconectar al WebSocket
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.errorSubject.next('No se pudo reconectar con el servidor de notificaciones');
      return;
    }

    this.reconnectAttempts++;
    
    setTimeout(() => {
      this.connect();
    }, this.reconnectInterval);
  }

  /**
   * Envía un mensaje al servidor
   */
  emit(event: string, data?: any): void {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    }
  }

  /**
   * Escucha un evento específico del servidor
   */
  on(event: string, callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  /**
   * Deja de escuchar un evento específico
   */
  off(event: string, callback?: (data: any) => void): void {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  /**
   * Obtiene el estado de conexión actual
   */
  isConnectedToServer(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  /**
   * Obtiene el ID del socket
   */
  getSocketId(): string | undefined {
    return this.socket?.id;
  }

  /**
   * Obtiene el número de intentos de reconexión
   */
  getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }

  /**
   * Reinicia el contador de intentos de reconexión
   */
  resetReconnectAttempts(): void {
    this.reconnectAttempts = 0;
  }

  /**
   * Configura el intervalo de reconexión
   */
  setReconnectInterval(interval: number): void {
    this.reconnectInterval = interval;
  }

  /**
   * Configura el número máximo de intentos de reconexión
   */
  setMaxReconnectAttempts(max: number): void {
    this.maxReconnectAttempts = max;
  }

  /**
   * Limpia todos los event listeners
   */
  private cleanup(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  /**
   * Cleanup al destruir el servicio
   */
  ngOnDestroy(): void {
    this.cleanup();
    this.disconnect();
  }
}
