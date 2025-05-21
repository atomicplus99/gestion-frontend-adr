// view-only-calendar.component.ts
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Calendar, CalendarOptions, EventInput, EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';

interface Evento {
    id: string;
    titulo: string;
    descripcion?: string;
    fecha_inicio: string;
    fecha_fin: string;
    ubicacion?: string;
    color?: string;
    categoria?: string;
}

type CategoriaEvento = 'academico' | 'administrativo' | 'formacion' | 'cultural' | 'deportivo' | 'social';

@Component({
    selector: 'app-view-only-calendar',
    standalone: true,
    imports: [CommonModule, HttpClientModule],
    template: `
    <div class="view-calendar-container">
      <!-- Barra superior con controles -->
      <div class="calendar-toolbar">
        <div class="toolbar-left">
          <button class="toolbar-btn today-btn" (click)="irAHoy()">
            Hoy
          </button>
          <div class="nav-buttons">
            <button class="toolbar-btn" (click)="navegarAnterior()">
              <i class="fas fa-chevron-left"></i>
            </button>
            <button class="toolbar-btn" (click)="navegarSiguiente()">
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
          <h2 class="calendar-title">{{ tituloCalendario }}</h2>
        </div>
        
        <div class="toolbar-right">
          <!-- Filtro de categorías con botones de colores para cada categoría -->
          <div class="category-filter">
            <button class="filter-btn" [class.active]="filtrosCategorias.length === 0" (click)="toggleFiltroTodasCategorias()">
              Todas
            </button>
            <button *ngFor="let cat of categorias" 
                  class="filter-btn" 
                  [style.border-color]="getColorCategoria(cat)"
                  [class.active]="filtrosCategorias.includes(cat)"
                  (click)="toggleFiltroCategoria(cat)">
              {{ cat | titlecase }}
            </button>
          </div>
          
          <!-- Selector de vistas simplificado -->
          <div class="view-selector">
            <button class="view-btn" (click)="cambiarVista('dayGridMonth')" [class.active]="vistaActual === 'dayGridMonth'">
              Mes
            </button>
            <button class="view-btn" (click)="cambiarVista('timeGridWeek')" [class.active]="vistaActual === 'timeGridWeek'">
              Semana
            </button>
            <button class="view-btn" (click)="cambiarVista('timeGridDay')" [class.active]="vistaActual === 'timeGridDay'">
              Día
            </button>
            <button class="view-btn" (click)="cambiarVista('listMonth')" [class.active]="vistaActual === 'listMonth'">
              Lista
            </button>
          </div>
        </div>
      </div>
      
      <div class="calendar-content">
        <!-- Estado de carga del calendario -->
        <div *ngIf="cargando" class="loading-overlay">
          <div class="spinner"></div>
        </div>
        
        <!-- Mensaje de error si falla la carga -->
        <div *ngIf="error" class="error-message">
          <i class="fas fa-exclamation-circle"></i>
          <p>No se pudieron cargar los eventos. <button (click)="cargarEventos()">Reintentar</button></p>
        </div>
        
        <!-- Calendario principal -->
        <div #calendarEl class="calendar-main"></div>
      </div>
      
      <!-- Modal de detalle de evento (solo visualización) -->
      <div *ngIf="eventoSeleccionado" class="event-modal">
        <div class="modal-backdrop" (click)="cerrarDetalleEvento()"></div>
        <div class="modal-content" [style.border-top]="'5px solid ' + (eventoSeleccionado.color || getColorCategoria(eventoSeleccionado.categoria))">
          <!-- Contenido del modal -->
          <!-- ... resto del template del modal ... -->
        </div>
      </div>
    </div>
  `,
    styles: [`
    :host {
  display: block;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
}

.view-calendar-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: white;
  border-radius: 0;
  overflow: hidden;
  box-shadow: none;
  margin: 0;
  min-height: 300px;
}

/* Barra de herramientas más compacta */
.calendar-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.4rem 0.5rem;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  flex-wrap: wrap;
}

.toolbar-left, .toolbar-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.calendar-title {
  font-size: 0.9rem;
  font-weight: 500;
  margin: 0;
  color: #333;
}

.toolbar-btn {
  background-color: white;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 0.2rem 0.4rem;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.nav-buttons {
  display: flex;
  gap: 0.2rem;
}

/* Filtros de categoría más compactos */
.category-filter {
  display: flex;
  gap: 0.3rem;
  flex-wrap: wrap;
}

.filter-btn {
  background-color: white;
  border: 2px solid #dee2e6;
  border-radius: 20px;
  padding: 0.2rem 0.4rem;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn.active {
  background-color: #f0f0f0;
  border-color: #aaa;
}

/* Selector de vistas más compacto */
.view-selector {
  display: flex;
  gap: 0.1rem;
}

.view-btn {
  background-color: transparent;
  border: none;
  padding: 0.2rem 0.4rem;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.view-btn.active {
  background-color: #e9ecef;
  border-radius: 4px;
}

/* Contenido del calendario con altura flexible */
.calendar-content {
  flex-grow: 1;
  height: calc(100% - 40px);
  position: relative;
  overflow: hidden;
}

.calendar-main {
  height: 100%;
  width: 100%;
}

/* Estilos para FullCalendar */
::ng-deep .fc {
  height: 100% !important;
  font-size: 0.8rem !important;
}

::ng-deep .fc-header-toolbar {
  display: none !important;
}

::ng-deep .fc-view-harness {
  height: calc(100% - 10px) !important;
}

::ng-deep .fc-daygrid-day-events {
  min-height: auto !important;
}

::ng-deep .fc-daygrid-day-top {
  padding: 0.1rem !important;
}

::ng-deep .fc-daygrid-day-number {
  font-size: 0.75rem !important;
}

::ng-deep .fc-event {
  padding: 1px 3px !important;
  font-size: 0.75rem !important;
}

/* Estilos para carga y errores */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 5;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-left-color: #4285F4;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 5;
  color: #d32f2f;
}

.error-message button {
  margin-top: 10px;
  padding: 5px 10px;
  background-color: #4285F4;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

/* Responsive para móviles */
@media (max-width: 768px) {
  .category-filter {
    display: none;
  }
  
  .toolbar-btn, .view-btn {
    padding: 0.15rem 0.3rem;
    font-size: 0.7rem;
  }
  
  .calendar-title {
    font-size: 0.8rem;
    max-width: 150px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
  `]
})
export class ViewOnlyCalendarComponent implements OnInit {
    @ViewChild('calendarEl') calendarEl!: ElementRef;

    private calendar!: Calendar;
    vistaActual: string = 'dayGridMonth';
    tituloCalendario: string = '';

    // Eventos y estados
    cargando: boolean = true;
    error: boolean = false;
    eventos: Evento[] = [];
    eventoSeleccionado: Evento | null = null;

    // Filtros
    filtrosCategorias: string[] = [];
    categorias: CategoriaEvento[] = ['academico', 'administrativo', 'formacion', 'cultural', 'deportivo', 'social'];

    // URL de la API
    private apiUrl: string = 'http://localhost:3000/eventos';

    // Mapa de colores por categoría
    private coloresCategorias: Record<CategoriaEvento, string> = {
        'academico': '#f44336',     // Rojo
        'administrativo': '#ff9800', // Naranja
        'formacion': '#4caf50',     // Verde
        'cultural': '#9c27b0',      // Púrpura
        'deportivo': '#2196f3',     // Azul
        'social': '#795548'         // Marrón
    };

    constructor(private http: HttpClient) { }

    ngOnInit(): void { }

    ngAfterViewInit(): void {
        this.inicializarCalendario();
        this.cargarEventos();
    }

    inicializarCalendario(): void {
        const opciones: CalendarOptions = {
            plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
            initialView: 'dayGridMonth',
            headerToolbar: false, // Usamos nuestra propia barra de herramientas
            locale: esLocale,
            height: '100%',
            editable: false, // No permitir edición
            selectable: false, // No permitir selección
            dayMaxEvents: true, // Limitar eventos por día
            firstDay: 1, // Lunes como primer día de la semana
            nowIndicator: true, // Indicador de hora actual
            eventTimeFormat: {
                hour: '2-digit',
                minute: '2-digit',
                meridiem: false
            },

            // Solo permitimos ver detalles
            eventClick: this.manejarClickEvento.bind(this),
            datesSet: this.manejarCambioFechas.bind(this),

            // Personalización del renderizado de eventos
            eventDidMount: this.personalizarEvento.bind(this),

            // Eventos vacíos inicialmente
            events: []
        };

        this.calendar = new Calendar(this.calendarEl.nativeElement, opciones);
        this.calendar.render();

        // Inicializar título
        this.actualizarTitulo();
    }

    cargarEventos(): void {
        this.cargando = true;
        this.error = false;

        this.http.get<Evento[]>(`${this.apiUrl}`).subscribe({
            
            next: (eventos) => {
                console.log(eventos);
                this.eventos = eventos;
                this.actualizarEventosEnCalendario();
                this.cargando = false;
            },
            error: (err) => {
                console.error('Error al cargar eventos:', err);
                this.error = true;
                this.cargando = false;
            }
        });
    }

    actualizarEventosEnCalendario(): void {
        // Filtrar eventos según categorías seleccionadas
        let eventosFiltrados = this.eventos;

        if (this.filtrosCategorias.length > 0) {
            eventosFiltrados = this.eventos.filter(e =>
                e.categoria && this.filtrosCategorias.includes(e.categoria.toLowerCase())
            );
        }

        // Convertir a formato FullCalendar
        const eventosFC = this.convertirEventosAFullCalendar(eventosFiltrados);

        // Actualizar eventos en calendario
        this.calendar.removeAllEvents();
        this.calendar.addEventSource(eventosFC);
    }

    // Navegación y cambio de vistas
    cambiarVista(vista: string): void {
        this.vistaActual = vista;
        this.calendar.changeView(vista);
    }

    irAHoy(): void {
        this.calendar.today();
        this.actualizarTitulo();
    }

    navegarAnterior(): void {
        this.calendar.prev();
        this.actualizarTitulo();
    }

    navegarSiguiente(): void {
        this.calendar.next();
        this.actualizarTitulo();
    }

    actualizarTitulo(): void {
        this.tituloCalendario = this.calendar.view.title;
    }

    // Gestión de filtros
    toggleFiltroCategoria(categoria: string): void {
        const index = this.filtrosCategorias.indexOf(categoria);

        if (index === -1) {
            this.filtrosCategorias.push(categoria);
        } else {
            this.filtrosCategorias.splice(index, 1);
        }

        this.actualizarEventosEnCalendario();
    }

    toggleFiltroTodasCategorias(): void {
        if (this.filtrosCategorias.length > 0) {
            this.filtrosCategorias = [];
        } else {
            this.filtrosCategorias = [...this.categorias];
        }

        this.actualizarEventosEnCalendario();
    }

    // Visualización de detalles
    manejarClickEvento(info: EventClickArg): void {
        info.jsEvent.preventDefault();

        const eventoId = info.event.id;

        // Cargar los detalles del evento desde la API
        this.http.get<Evento>(`${this.apiUrl}/${eventoId}`).subscribe({
            next: (evento) => {
                this.eventoSeleccionado = evento;
            },
            error: (err) => {
                console.error(`Error al cargar detalles del evento ${eventoId}:`, err);

                // Si falla, buscamos el evento en la lista local
                const eventoLocal = this.eventos.find(e => e.id === eventoId);
                if (eventoLocal) {
                    this.eventoSeleccionado = eventoLocal;
                }
            }
        });
    }

    manejarCambioFechas(dateInfo: any): void {
        this.actualizarTitulo();
    }

    personalizarEvento(info: any): void {
        // Añadir tooltip al evento
        const eventEl = info.el;
        const evento = info.event;

        // Asignar el color correcto según categoría si no tiene color propio
        if (!evento.backgroundColor && evento.extendedProps.categoria) {
            const categoria = evento.extendedProps.categoria.toLowerCase() as CategoriaEvento;
            if (categoria in this.coloresCategorias) {
                eventEl.style.backgroundColor = this.coloresCategorias[categoria];
            }
        }

        // Añadir un título para mostrar la info al hacer hover
        eventEl.title = `${evento.title}\n${this.formatFechaSimple(evento.start)} ${this.formatHora(evento.start)}`;
        if (evento.end && evento.start.toDateString() !== evento.end.toDateString()) {
            eventEl.title += ` - ${this.formatFechaSimple(evento.end)} ${this.formatHora(evento.end)}`;
        } else if (evento.end) {
            eventEl.title += ` - ${this.formatHora(evento.end)}`;
        }

        if (evento.extendedProps.ubicacion) {
            eventEl.title += `\nUbicación: ${evento.extendedProps.ubicacion}`;
        }
    }

    // Cierre del modal de detalles
    cerrarDetalleEvento(): void {
        this.eventoSeleccionado = null;
    }

    // Funciones de utilidad para fechas
    formatFechaDetalle(fechaStr: string): string {
        const fecha = new Date(fechaStr);
        const opciones: Intl.DateTimeFormatOptions = {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        };

        return fecha.toLocaleDateString('es-ES', opciones);
    }

    formatHoraDetalle(fechaStr: string): string {
        const fecha = new Date(fechaStr);
        return fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }

    formatFechaSimple(fecha: Date): string {
        return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    }

    formatHora(fecha: Date): string {
        return fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }

    esMismoDia(fecha1Str: string, fecha2Str: string): boolean {
        const fecha1 = new Date(fecha1Str);
        const fecha2 = new Date(fecha2Str);

        return fecha1.toDateString() === fecha2.toDateString();
    }

    esMismaHora(fecha1Str: string, fecha2Str: string): boolean {
        const hora1 = this.formatHoraDetalle(fecha1Str);
        const hora2 = this.formatHoraDetalle(fecha2Str);

        return hora1 === hora2;
    }

    // Obtener color según categoría
    getColorCategoria(categoria?: string): string {
        if (!categoria) return '#4285F4'; // Color por defecto

        const categoriaLower = categoria.toLowerCase() as CategoriaEvento;
        return this.coloresCategorias[categoriaLower] || '#4285F4';
    }

    private convertirEventosAFullCalendar(eventos: Evento[]): EventInput[] {
        return eventos.map(evento => ({
            id: evento.id,
            title: evento.titulo,
            start: evento.fecha_inicio,
            end: evento.fecha_fin,
            backgroundColor: evento.color || this.getColorCategoria(evento.categoria),
            borderColor: 'transparent',
            extendedProps: {
                descripcion: evento.descripcion,
                ubicacion: evento.ubicacion,
                categoria: evento.categoria
            }
        }));
    }
}