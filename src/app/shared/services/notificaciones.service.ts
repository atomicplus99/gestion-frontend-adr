import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Notificacion,
  NotificacionesResponse,
  ContadorNotificaciones,
  MarcarLeidaResponse,
  NotificacionesQueryParams,
  WebSocketGatewayStatus,
  TestNotificationResponse,
  BackendNotificationResponse,
  TipoNotificacion,
  EstadoNotificacion
} from '../interfaces/notificaciones.interface';

@Injectable({
  providedIn: 'root'
})
export class NotificacionesService {
  private readonly baseUrl = `${environment.apiUrl}/notificaciones`;
  
  // Cache de notificaciones
  private notificacionesCache = new Map<string, Notificacion>();
  private cacheTimestamp: number | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
  
  // Subjects para notificaciones en tiempo real
  private notificacionesSubject = new BehaviorSubject<Notificacion[]>([]);
  private contadorSubject = new BehaviorSubject<ContadorNotificaciones>({
    total_no_leidas: 0,
    por_tipo: { SCHEDULER: 0, JUSTIFICACION: 0, SISTEMA: 0 }
  });
  private nuevaNotificacionSubject = new Subject<Notificacion>();
  
  // Observables públicos
  public notificaciones$ = this.notificacionesSubject.asObservable();
  public contador$ = this.contadorSubject.asObservable();
  public nuevaNotificacion$ = this.nuevaNotificacionSubject.asObservable();
  
  // Estado interno
  private notificaciones: Notificacion[] = [];
  private contador: ContadorNotificaciones = {
    total_no_leidas: 0,
    por_tipo: { SCHEDULER: 0, JUSTIFICACION: 0, SISTEMA: 0 }
  };

  constructor(private http: HttpClient) {
  }

  /**
   * Maneja una notificación marcada como leída recibida por WebSocket
   */
  handleNotificacionMarcadaLeidaEnTiempoReal(id: string, fechaLectura: string): void {
    // Actualizar la notificación local
    const index = this.notificaciones.findIndex(n => n.id === id);
    if (index !== -1) {
      this.notificaciones[index].estado = 'leida';
      this.notificaciones[index].fecha_lectura = fechaLectura;
      
      // Filtrar solo las NO LEÍDAS para la lista
      const notificacionesNoLeidas = this.notificaciones.filter(n => n.estado === 'no_leida');
      this.notificacionesSubject.next(notificacionesNoLeidas);
    }
    
    // Eliminar del cache
    this.notificacionesCache.delete(id);
    
    // Actualizar contador
    this.actualizarContador();
  }

  /**
   * Obtiene las notificaciones con paginación y filtros
   */
  obtenerNotificaciones(params: NotificacionesQueryParams = {}): Observable<NotificacionesResponse> {
    // Verificar si tenemos cache válido
    if (this.isCacheValid() && !params.tipo && !params.estado) {
      const cachedData = this.getCachedData();
      if (cachedData) {
        return new Observable(observer => {
          observer.next(cachedData);
          observer.complete();
        });
      }
    }

    let httpParams = new HttpParams();
    
    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params.tipo) httpParams = httpParams.set('tipo', params.tipo);
    if (params.estado) httpParams = httpParams.set('estado', params.estado);
    
    const url = `${this.baseUrl}`;
    
    return this.http.get<BackendNotificationResponse<NotificacionesResponse>>(url, { params: httpParams })
      .pipe(
        map(response => {
          return response.data;
        }),
        tap(data => {
          // Guardar todas las notificaciones internamente
          this.notificaciones = data.notificaciones;
          
          // Solo mostrar las NO LEÍDAS en el observable
          const notificacionesNoLeidas = data.notificaciones.filter(n => n.estado === 'no_leida');
          this.notificacionesSubject.next(notificacionesNoLeidas);
          
          // Actualizar cache (solo NO LEÍDAS)
          this.updateCache(data.notificaciones);
        })
      );
  }

  /**
   * Marca una notificación como leída
   */
  marcarComoLeida(id: string): Observable<MarcarLeidaResponse> {
    const url = `${this.baseUrl}/${id}/marcar-leida`;
    
    return this.http.patch<BackendNotificationResponse<MarcarLeidaResponse>>(url, {})
      .pipe(
        map(response => {
          return response.data;
        }),
        tap(data => {
          // Actualizar la notificación local
          const index = this.notificaciones.findIndex(n => n.id === id);
          if (index !== -1) {
            this.notificaciones[index].estado = 'leida';
            this.notificaciones[index].fecha_lectura = data.notificacion.fecha_lectura;
            
            // Filtrar solo las NO LEÍDAS para la lista
            const notificacionesNoLeidas = this.notificaciones.filter(n => n.estado === 'no_leida');
            this.notificacionesSubject.next(notificacionesNoLeidas);
          }
          
          // Eliminar del cache cuando se marca como leída
          this.notificacionesCache.delete(id);
          
          // Actualizar contador
          this.actualizarContador();
        })
      );
  }

  /**
   * Obtiene el contador de notificaciones no leídas
   */
  obtenerContador(): Observable<ContadorNotificaciones> {
    const url = `${this.baseUrl}/contador`;
    
    return this.http.get<BackendNotificationResponse<ContadorNotificaciones>>(url)
      .pipe(
        map(response => {
          return response.data;
        }),
        tap(data => {
          this.contador = data;
          this.contadorSubject.next(this.contador);
        })
      );
  }

  /**
   * Obtiene el estado del gateway WebSocket
   */
  obtenerEstadoGateway(): Observable<WebSocketGatewayStatus> {
    const url = `${this.baseUrl}/test-gateway`;
    
    return this.http.get<BackendNotificationResponse<WebSocketGatewayStatus>>(url)
      .pipe(
        map(response => {
          return response.data;
        })
      );
  }

  /**
   * Envía una notificación de prueba
   */
  enviarNotificacionPrueba(usuarioProgramador: any): Observable<TestNotificationResponse> {
    const url = `${this.baseUrl}/test-scheduler`;
    const payload = { usuario_programador: usuarioProgramador };
    
    return this.http.post<BackendNotificationResponse<TestNotificationResponse>>(url, payload)
      .pipe(
        map(response => {
          return response.data;
        })
      );
  }

  /**
   * Agrega una nueva notificación (para WebSocket)
   */
  agregarNuevaNotificacion(notificacion: Notificacion): void {
    // Solo agregar si NO está leída
    if (notificacion.estado === 'no_leida') {
      // Agregar al inicio de la lista
      this.notificaciones.unshift(notificacion);
      
      // Solo mostrar las NO LEÍDAS en el observable
      const notificacionesNoLeidas = this.notificaciones.filter(n => n.estado === 'no_leida');
      this.notificacionesSubject.next(notificacionesNoLeidas);
      
      // Emitir evento de nueva notificación
      this.nuevaNotificacionSubject.next(notificacion);
      
      // Actualizar contador
      this.actualizarContador();
    }
  }

  /**
   * Actualiza el contador interno (solo basado en notificaciones NO LEÍDAS)
   */
  private actualizarContador(): void {
    // Solo contar las notificaciones NO LEÍDAS
    const noLeidas = this.notificaciones.filter(n => n.estado === 'no_leida');
    const porTipo = {
      SCHEDULER: noLeidas.filter(n => n.tipo === 'SCHEDULER').length,
      JUSTIFICACION: noLeidas.filter(n => n.tipo === 'JUSTIFICACION').length,
      SISTEMA: noLeidas.filter(n => n.tipo === 'SISTEMA').length
    };
    
    this.contador = {
      total_no_leidas: noLeidas.length,
      por_tipo: porTipo
    };
    
    this.contadorSubject.next(this.contador);
  }

  /**
   * Obtiene las notificaciones actuales del servicio
   */
  getNotificacionesActuales(): Notificacion[] {
    return [...this.notificaciones];
  }

  /**
   * Obtiene el contador actual del servicio
   */
  getContadorActual(): ContadorNotificaciones {
    return { ...this.contador };
  }

  /**
   * Limpia todas las notificaciones del servicio
   */
  limpiarNotificaciones(): void {
    this.notificaciones = [];
    this.notificacionesSubject.next([]);
    this.contador = {
      total_no_leidas: 0,
      por_tipo: { SCHEDULER: 0, JUSTIFICACION: 0, SISTEMA: 0 }
    };
    this.contadorSubject.next(this.contador);
  }

  /**
   * Formatea una fecha de notificación para mostrar
   */
  formatearFechaNotificacion(fecha: string): string {
    const fechaObj = new Date(fecha);
    const ahora = new Date();
    const diffMs = ahora.getTime() - fechaObj.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'Hace un momento';
    } else if (diffMins < 60) {
      return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    } else if (diffHours < 24) {
      return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    } else if (diffDays < 7) {
      return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    } else {
      return fechaObj.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
  }

  /**
   * Obtiene el icono para el tipo de notificación
   */
  getIconoTipo(tipo: TipoNotificacion): string {
    switch (tipo) {
      case 'SCHEDULER':
        return '⏰';
      case 'JUSTIFICACION':
        return '📋';
      case 'SISTEMA':
        return '⚙️';
      default:
        return '🔔';
    }
  }

  /**
   * Obtiene la clase CSS para el tipo de notificación
   */
  getClaseTipo(tipo: TipoNotificacion): string {
    switch (tipo) {
      case 'SCHEDULER':
        return 'bg-blue-100 text-blue-800';
      case 'JUSTIFICACION':
        return 'bg-green-100 text-green-800';
      case 'SISTEMA':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Obtiene la clase CSS para la prioridad
   */
  getClasePrioridad(prioridad: string): string {
    switch (prioridad) {
      case 'ALTA':
        return 'text-red-600';
      case 'MEDIA':
        return 'text-yellow-600';
      case 'BAJA':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  }

  /**
   * Obtiene una notificación específica por ID (desde cache o API)
   */
  obtenerNotificacionPorId(id: string): Observable<Notificacion> {
    // Verificar cache primero (solo para notificaciones NO LEÍDAS)
    const cachedNotificacion = this.notificacionesCache.get(id);
    if (cachedNotificacion && cachedNotificacion.estado === 'no_leida') {
      return new Observable(observer => {
        observer.next(cachedNotificacion);
        observer.complete();
      });
    }

    // Si no está en cache, buscar en las notificaciones actuales
    const notificacion = this.notificaciones.find(n => n.id === id);
    if (notificacion) {
      // Solo guardar en cache si NO está leída
      if (notificacion.estado === 'no_leida') {
        this.notificacionesCache.set(id, notificacion);
      }
      return new Observable(observer => {
        observer.next(notificacion);
        observer.complete();
      });
    }

    // Si no se encuentra, hacer petición a la API
    const url = `${this.baseUrl}/${id}`;
    return this.http.get<BackendNotificationResponse<Notificacion>>(url)
      .pipe(
        map(response => {
          const notificacion = response.data;
          // Solo guardar en cache si NO está leída
          if (notificacion.estado === 'no_leida') {
            this.notificacionesCache.set(id, notificacion);
          }
          return notificacion;
        })
      );
  }

  /**
   * Verifica si el cache es válido
   */
  private isCacheValid(): boolean {
    if (!this.cacheTimestamp) return false;
    return (Date.now() - this.cacheTimestamp) < this.CACHE_DURATION;
  }

  /**
   * Actualiza el cache con las notificaciones (solo las NO LEÍDAS)
   */
  private updateCache(notificaciones: Notificacion[]): void {
    notificaciones.forEach(notificacion => {
      // Solo guardar en cache las notificaciones NO LEÍDAS
      if (notificacion.estado === 'no_leida') {
        this.notificacionesCache.set(notificacion.id, notificacion);
      } else {
        // Si está leída, eliminarla del cache
        this.notificacionesCache.delete(notificacion.id);
      }
    });
    this.cacheTimestamp = Date.now();
  }

  /**
   * Obtiene los datos del cache (solo NO LEÍDAS)
   */
  private getCachedData(): NotificacionesResponse | null {
    const notificacionesNoLeidas = this.notificaciones.filter(n => n.estado === 'no_leida');
    if (notificacionesNoLeidas.length === 0) return null;
    
    return {
      notificaciones: notificacionesNoLeidas,
      pagination: {
        page: 1,
        limit: notificacionesNoLeidas.length,
        total: notificacionesNoLeidas.length,
        totalPages: 1
      }
    };
  }

  /**
   * Limpia el cache
   */
  limpiarCache(): void {
    this.notificacionesCache.clear();
    this.cacheTimestamp = null;
  }

  /**
   * Quita una notificación específica del cache
   */
  quitarDelCache(id: string): void {
    this.notificacionesCache.delete(id);
  }
}
