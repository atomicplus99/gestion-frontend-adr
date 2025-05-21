// upcoming-events.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { RouterLink } from '@angular/router';

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

// Definir un tipo para las categorías conocidas
type CategoriaEvento = 'academico' | 'administrativo' | 'formacion' | 'cultural' | 'deportivo' | 'social';

@Component({
  selector: 'app-upcoming-events',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterLink],
  template: `
    <div class="upcoming-events-widget">
      <div class="widget-header">
        <h2><i class="fas fa-calendar-alt"></i> Próximos eventos</h2>
      </div>
      
      <div class="widget-content">
        <div *ngIf="cargando" class="loading-indicator">
          <div class="spinner-small"></div>
          <span>Cargando eventos...</span>
        </div>
        
        <div *ngIf="!cargando && eventos.length === 0" class="no-events">
          <p>No hay eventos próximos programados</p>
        </div>
        
        <ul *ngIf="!cargando && eventos.length > 0" class="event-list">
          <li *ngFor="let evento of eventos" class="event-item" [ngClass]="{'event-soon': isEventSoon(evento.fecha_inicio)}">
            <div class="event-marker" [style.background-color]="getEventColor(evento)"></div>
            <div class="event-details">
              <h3>{{ evento.titulo }}</h3>
              <div class="event-date">
                <i class="fas fa-clock"></i> {{ formatDate(evento.fecha_inicio) }}
              </div>
              <div *ngIf="evento.ubicacion" class="event-location">
                <i class="fas fa-map-marker-alt"></i> {{ evento.ubicacion }}
              </div>
            </div>
          </li>
        </ul>
      </div>
      
      <div class="widget-footer">
        <a routerLink="/calendario" class="view-all-link">
          Ver calendario completo <i class="fas fa-arrow-right"></i>
        </a>
      </div>
    </div>
  `,
  styles: [`
    .upcoming-events-widget {
      background: white;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    
    .widget-header {
      padding: 1.2rem 1.5rem;
      border-bottom: 1px solid #f0f0f0;
    }
    
    .widget-header h2 {
      margin: 0;
      font-size: 1.2rem;
      color: #333;
      font-weight: 500;
      display: flex;
      align-items: center;
    }
    
    .widget-header h2 i {
      color: #4285F4;
      margin-right: 0.7rem;
    }
    
    .widget-content {
      padding: 1rem 0;
      flex-grow: 1;
      overflow-y: auto;
    }
    
    .loading-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem 0;
      color: #666;
    }
    
    .spinner-small {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(0, 0, 0, 0.1);
      border-radius: 50%;
      border-left-color: #4285F4;
      animation: spin 1s linear infinite;
      margin-right: 0.8rem;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .no-events {
      text-align: center;
      padding: 2rem 0;
      color: #666;
    }
    
    .no-events p {
      margin: 0;
    }
    
    .event-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    
    .event-item {
      display: flex;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #f5f5f5;
      transition: background-color 0.2s;
    }
    
    .event-item:last-child {
      border-bottom: none;
    }
    
    .event-item:hover {
      background-color: #f9f9f9;
    }
    
    .event-marker {
      width: 4px;
      border-radius: 2px;
      margin-right: 12px;
    }
    
    .event-details {
      flex: 1;
    }
    
    .event-details h3 {
      margin: 0 0 0.5rem 0;
      font-size: 1rem;
      font-weight: 500;
      color: #333;
    }
    
    .event-date, .event-location {
      font-size: 0.85rem;
      color: #666;
      margin-bottom: 0.3rem;
      display: flex;
      align-items: center;
    }
    
    .event-date i, .event-location i {
      font-size: 0.8rem;
      color: #4285F4;
      margin-right: 0.5rem;
    }
    
    .event-soon {
      background-color: rgba(251, 188, 5, 0.1);
    }
    
    .widget-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid #f0f0f0;
      text-align: right;
    }
    
    .view-all-link {
      color: #4285F4;
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 500;
      display: inline-flex;
      align-items: center;
      transition: color 0.2s;
    }
    
    .view-all-link:hover {
      color: #1a73e8;
    }
    
    .view-all-link i {
      margin-left: 0.5rem;
      font-size: 0.8rem;
    }
  `]
})
export class UpcomingEventsComponent implements OnInit {
  eventos: Evento[] = [];
  cargando = true;
  
  // Definir el objeto con índice de tipo
  private categoryColors: Record<CategoriaEvento, string> = {
    'academico': '#f44336',     // Rojo
    'administrativo': '#ff9800', // Naranja
    'formacion': '#4caf50',     // Verde
    'cultural': '#9c27b0',      // Púrpura
    'deportivo': '#2196f3',     // Azul
    'social': '#795548'         // Marrón
  };
  
  constructor(private http: HttpClient) {}
  
  ngOnInit() {
    this.cargarEventosProximos();
  }
  
  cargarEventosProximos(limit: number = 5) {
    this.cargando = true;
    this.http.get<Evento[]>(`http://localhost:3000/eventos/events?limit=${limit}`).subscribe({
      next: (data) => {
        this.eventos = data;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar eventos próximos:', error);
        this.cargando = false;
      }
    });
  }
  
  getEventColor(evento: Evento): string {
    // Si el evento ya tiene un color definido, usarlo
    if (evento.color) return evento.color;
    
    // Verificar si la categoría existe y es válida
    if (evento.categoria) {
      // Convertir a minúsculas
      const categoriaLower = evento.categoria.toLowerCase() as CategoriaEvento;
      
      // Verificar si la categoría existe en nuestro objeto de colores
      if (categoriaLower in this.categoryColors) {
        return this.categoryColors[categoriaLower];
      }
    }
    
    // Color por defecto
    return '#4285F4';
  }
  
  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    return date.toLocaleDateString('es-ES', options);
  }
  
  isEventSoon(dateStr: string): boolean {
    const eventDate = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 3; // Evento en los próximos 3 días
  }
}