// main-welcome.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MotivationalMessageComponent } from '../components/message-motivationals/message-motivationals.component';
import { ViewOnlyCalendarComponent } from '../components/calendar/calendar.component';
import { UserStoreService } from '../../../../auth/store/user.store';
import { environment } from '../../../../../environments/environment';

interface QuickStat {
    label: string;
    value: string | number;
    color: string;
}

interface QuickLink {
    name: string;
    icon: string;
    route: string;
}

@Component({
    selector: 'app-main-welcome',
    standalone: true,
    imports: [
        CommonModule,
        RouterLink,
        MotivationalMessageComponent,
        ViewOnlyCalendarComponent,
    ],
    template: `
<div class="main-welcome-container">
  <!-- Todo el contenido sin espacios sobrantes -->
  <div class="welcome-section">
    <h1>Bienvenido al Administrador de <span class="text-blue-500">Alumnos</span></h1>
    <p>Andres de los Reyes</p>
  </div>
  
  <div class="profile-section">


      

    

    <div class="profile-card">
      <div class="avatar-container">
        <img [src]="getUserPhoto()" alt="Foto de perfil">
      </div>
      <h2>{{ user()?.nombreCompleto || 'Luis García' }}</h2>
      <p class="username">{{ user()?.username || 'auxiliar1' }}</p>
      <div class="badge">{{ user()?.role || 'AUXILIAR' }}</div>
      <p class="user-id">ID: {{ user()?.idUser?.substring(0, 9) || '9e4b1d6a' }}</p>
    </div>
  </div>
  
  <div class="stats-section">
    <h2 class="section-title">Estadísticas rápidas</h2>
    <div class="stats-container">
      <div *ngFor="let stat of stats" class="stat-card" [style.border-left-color]="stat.color">
        <div class="stat-value">{{ stat.value }}</div>
        <div class="stat-label">{{ stat.label }}</div>
      </div>
    </div>
  </div>

  
  
  <div class="links-weather-section">
    <div class="links-container">
      <h2 class="section-title">Enlaces rápidos</h2>
      <div class="links-grid">
        <a *ngFor="let link of links" [routerLink]="[link.route]" class="link-item">
          <i class="fas fa-{{ link.icon }}"></i>
          <span>{{ link.name }}</span>
        </a>
      </div>
    </div>

    <div class="weather-container">
      <h3>Lima, Perú</h3>
      <p class="date">lunes, 19 de mayo</p>
      <div class="temp">25°C</div>
      <div class="condition">Soleado</div>
  </div>
    
    
  </div>
  
  <div class="motivational-section">
    <app-motivational-message
      [showRefreshButton]="false"
      [autoRefreshInterval]="3600000"
    ></app-motivational-message>
  </div>
  
  <div class="notices-events-section">
    <div class="notices-container">
      <h2 class="section-title">Notificaciones recientes</h2>
      <div class="notices-list">
        <div class="notice-item" style="border-left-color: #4285F4;">
          <h3>Nueva asignación</h3>
          <p>Se ha asignado una nueva tarea en el curso de Matemáticas.</p>
          <div class="indicator" style="background-color: #4285F4;"></div>
        </div>
        <div class="notice-item" style="border-left-color: #ddd;">
          <h3>Recordatorio de entrega</h3>
          <p>El plazo para la entrega del proyecto final es mañana.</p>
          <div class="indicator" style="background-color: #ddd;"></div>
        </div>
      </div>
    </div>
    
    <div class="events-container">
      <h2 class="section-title">Próximos eventos</h2>
      <div class="events-list">
        <div class="event-item">
          <div class="event-date">
            <span class="day">21</span>
            <span class="month">MAY</span>
          </div>
          <div class="event-info">
            <h3>Reunión académica</h3>
            <p>10:00 AM</p>
          </div>
        </div>
        <div class="event-item">
          <div class="event-date">
            <span class="day">22</span>
            <span class="month">MAY</span>
          </div>
          <div class="event-info">
            <h3>Reunión académica</h3>
            <p>10:00 AM</p>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <div class="calendar-section">
    <h2 class="section-title">Calendario de eventos</h2>
    <div class="calendar-container">
      <app-view-only-calendar></app-view-only-calendar>
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



.main-welcome-container {
  width: 100%;
  height: auto;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
}

/* Sección de bienvenida */
.welcome-section {
  width: 100%;
  padding: 20px 0;
  text-align: center;
  background-color: white;
  border-bottom: 1px solid #e0e0e0;
}

.welcome-section h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
}

.welcome-section p {
  margin: 8px 0 0 0;
  color: #666;
  font-size: 16px;
}

/* Sección de perfil */
.profile-section {
  width: 95%;
  height: 100%;
  padding: 30px 0;
  display: flex;
  justify-content: center;
  background-color: #f0f4f8;
  border-bottom: 1px solid #e0e0e0;
}

.profile-card {
  height: 100%;
  width: 70%;
  max-width: 100%;
  background-color: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.avatar-container {
  width: 120px;
  height: 120px;
  padding: 6px;
  margin-bottom: 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e6f2ff, #f0f8ff);
  box-shadow: 0 5px 15px rgba(66, 133, 244, 0.15);
}

.avatar-container img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #4285F4;
}

.profile-card h2 {
  margin: 0 0 10px 0;
  font-size: 28px;
  font-weight: 600;
  color: #333;
}

.profile-card .username {
  margin: 8px 0;
  font-size: 18px;
  color: #555;
}

.profile-card .badge {
  display: inline-block;
  padding: 6px 20px;
  margin: 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: white;
  background-color: #4285F4;
  border-radius: 30px;
  letter-spacing: 0.5px;
}

.profile-card .user-id {
  margin: 8px 0 0 0;
  font-size: 15px;
  color: #888;
}

/* Sección de estadísticas */
.stats-section {
  width: 100%;
  padding: 20px;
  background-color: white;
  border-bottom: 1px solid #e0e0e0;
}

.section-title {
  margin: 0 0 15px 0;
  font-size: 18px;
  font-weight: 500;
  color: #333;
}

.stats-container {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
}

.stat-card {
  background-color: white;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border-left: 4px solid;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #333;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-top: 5px;
}

/* Sección de enlaces y clima */
.links-weather-section {
  width: 100%;
  padding: 20px;
  display: grid;
  grid-template-columns: 3fr 1fr;
  gap: 15px;
  background-color: white;
  border-bottom: 1px solid #e0e0e0;
}

.links-container {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.links-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px;
}

.link-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px;
  border-radius: 8px;
  text-decoration: none;
  color: #333;
  transition: background-color 0.2s;
}

.link-item:hover {
  background-color: rgba(66, 133, 244, 0.1);
}

.link-item i {
  font-size: 24px;
  color: #4285F4;
  margin-bottom: 8px;
}

.link-item span {
  font-size: 14px;
  text-align: center;
}

.weather-container {
  background: linear-gradient(135deg, #4facfe, #00f2fe);
  color: white;
  border-radius: 8px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.weather-container h3 {
  margin: 0 0 5px 0;
  font-size: 18px;
  font-weight: 500;
}

.weather-container .date {
  font-size: 13px;
  opacity: 0.9;
  margin: 0 0 12px 0;
}

.weather-container .temp {
  font-size: 40px;
  font-weight: 600;
  margin: 8px 0;
}

.weather-container .condition {
  font-size: 16px;
}

/* Sección de mensaje motivacional */
.motivational-section {
  width: 100%;
  border-bottom: 1px solid #e0e0e0;
}

/* Sección de notificaciones y eventos */
.notices-events-section {
  width: 100%;
  padding: 20px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  background-color: white;
  border-bottom: 1px solid #e0e0e0;
}

.notices-container, .events-container {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.notices-list, .events-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notice-item {
  position: relative;
  padding: 12px;
  border-radius: 8px;
  background-color: white;
  border-left: 4px solid;
}

.notice-item h3 {
  margin: 0 0 5px 0;
  font-size: 15px;
  font-weight: 500;
}

.notice-item p {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.notice-item .indicator {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.event-item {
  display: flex;
  align-items: center;
  padding: 10px;
  background-color: white;
  border-radius: 8px;
}

.event-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 60px;
  height: 60px;
  background-color: #4285F4;
  color: white;
  border-radius: 8px;
  margin-right: 12px;
}

.event-date .day {
  font-size: 20px;
  font-weight: bold;
  line-height: 1;
}

.event-date .month {
  font-size: 12px;
  text-transform: uppercase;
}

.event-info h3 {
  margin: 0 0 5px 0;
  font-size: 15px;
  font-weight: 500;
}

.event-info p {
  margin: 0;
  font-size: 14px;
  color: #666;
}

/* Sección de calendario */
.calendar-section {
  width: 100%;
  padding: 20px;
  background-color: white;
}

.calendar-container {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  height: 400px;
}

/* Estilos responsivos */
@media (max-width: 992px) {
  .stats-container {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .links-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .links-weather-section {
    grid-template-columns: 1fr;
  }
  
  .weather-container {
    margin-top: 10px;
  }
}

@media (max-width: 768px) {
  .welcome-section h1 {
    font-size: 24px;
  }
  
  .profile-card {
    max-width: 350px;
    padding: 20px;
  }
  
  .avatar-container {
    width: 100px;
    height: 100px;
  }
  
  .profile-card h2 {
    font-size: 24px;
  }
  
  .profile-card .badge {
    font-size: 14px;
    padding: 5px 15px;
  }
  
  .notices-events-section {
    grid-template-columns: 1fr;
  }
  
  .calendar-container {
    height: 350px;
  }
}

/* Asegurar que no haya márgenes innecesarios en componentes internos */
app-motivational-message,
app-view-only-calendar {
  display: block;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
}
    `]
})
export class MainWelcomeComponent implements OnInit {
    // Datos estáticos
    stats: QuickStat[] = [
        { label: 'Asistencia', value: '95%', color: '#4285F4' },
        { label: 'Tareas pendientes', value: '3', color: '#9C27B0' },
        { label: 'Cursos activos', value: '5', color: '#4CAF50' },
        { label: 'Promedio', value: '18.5', color: '#FF9800' }
    ];

    links: QuickLink[] = [
        { name: 'Cursos', icon: 'graduation-cap', route: '/cursos' },
        { name: 'Tareas', icon: 'tasks', route: '/tareas' },
        { name: 'Biblioteca', icon: 'book', route: '/biblioteca' },
        { name: 'Horarios', icon: 'clock', route: '/horarios' },
        { name: 'Mensajes', icon: 'envelope', route: '/mensajes' },
        { name: 'Recursos', icon: 'file-alt', route: '/recursos' },
    ];

    constructor(private userStore: UserStoreService) { }

    // Getter para acceder al usuario desde el template
    get user() {
        return this.userStore.user;
    }

    ngOnInit(): void {
        console.log('Usuario actual:', this.userStore.user());
    }

    // Método para obtener la URL de la foto de perfil
    getUserPhoto(): string {
        return `${environment.apiUrl}/uploads/profiles/no-image.png`;
    }
}