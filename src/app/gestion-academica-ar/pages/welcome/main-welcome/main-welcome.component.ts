import { Component, Input, inject, computed, signal, OnInit, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { UserStoreService } from '../../../../auth/store/user.store';
import { UsuarioService } from '../../usuarios/services/usuario.service';
import { PhotoService } from '../../../../shared/services/photo.service';
import { environment } from '../../../../../environments/environment';



interface WeatherData {
  location: {
    name: string;
    country: string;
  };
  current: {
    temp_c: number;
    condition: {
      text: string;
      icon: string;
    };
    humidity: number;
    wind_kph: number;
  };
}

interface NewsItem {
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  source: {
    name: string;
  };
}

interface CountryInfo {
  name: {
    common: string;
  };
  population: number;
  capital: string[];
  region: string;
  flags: {
    png: string;
  };
}

interface HolidayInfo {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
}

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './main-welcome.component.html'
})
export class WelcomeComponent implements OnInit, OnDestroy {
  @Input() welcomeMessage?: string;
  
  private userStore = inject(UserStoreService);
  private http = inject(HttpClient);
  private usuarioService = inject(UsuarioService);
  private photoService = inject(PhotoService);

  constructor() {
    // Efecto para reaccionar a cambios en el userStore
    effect(() => {
      const currentUser = this.currentUser();
      if (currentUser?.idUser) {
        // Recargar foto cuando cambie el usuario
        this.loadUserPhoto();
      }
    });
  }
  
  // Signals para datos en tiempo real
  currentUser = this.userStore.user;
  weather = signal<WeatherData | null>(null);
  worldNews = signal<NewsItem[]>([]);
  countryInfo = signal<CountryInfo | null>(null);
  upcomingHolidays = signal<HolidayInfo[]>([]);
  
  // Signals para tiempo y stats en tiempo real
  currentTime = signal<string>('');
  currentDate = signal<string>('');
  sessionTime = signal<string>('0:00');
  globalTimeZones = signal<{city: string, time: string}[]>([]);
  
  // Signal para la URL real de la foto
  realPhotoUrl = signal<string>('');
  
  private sessionStartTime = Date.now();
  private timeInterval?: number;
  
  // Computed para el nombre a mostrar
  displayName = computed(() => {
    const user = this.currentUser();
    if (!user) return '';
    
    if (user.auxiliar) {
      return `${user.auxiliar.nombre} ${user.auxiliar.apellido}`;
    } else if (user.alumno) {
      return `${user.alumno.nombre} ${user.alumno.apellido}`;
    } else if (user.director) {
      return `${user.director.nombres} ${user.director.apellidos}`;
    } else if (user.administrador) {
      return `${user.administrador.nombres} ${user.administrador.apellidos}`;
    }
    return user.username;
  });

  ngOnInit() {
    this.initializeTimeUpdates();
    this.loadWeatherData();
    this.loadWorldNews();
    this.loadCountryInfo();
    this.loadUpcomingHolidays();
    this.loadGlobalTimes();
    this.loadUserPhoto();
  }

  ngOnDestroy() {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }

  private initializeTimeUpdates() {
    this.updateTime();
    this.timeInterval = window.setInterval(() => {
      this.updateTime();
      this.updateSessionTime();
    }, 1000);
  }

  private updateTime() {
    const now = new Date();
    this.currentTime.set(now.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }));
    this.currentDate.set(now.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }));
  }

  private updateSessionTime() {
    const elapsed = Date.now() - this.sessionStartTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    this.sessionTime.set(`${minutes}:${seconds.toString().padStart(2, '0')}`);
  }

  private loadWeatherData() {
    // WeatherAPI - API real con clave válida
    const apiKey = environment.weatherApiKey;
    if (apiKey && apiKey !== 'TU_CLAVE_WEATHERAPI_AQUI') {
      this.http.get<WeatherData>(`https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=Lima&aqi=no`)
        .subscribe({
          next: (data) => {
            console.log('✅ [WEATHER] Datos obtenidos de WeatherAPI:', data);
            this.weather.set(data);
          },
          error: (error) => {
            console.warn('⚠️ [WEATHER] Error con WeatherAPI, intentando OpenWeatherMap:', error);
            this.loadWeatherFromOpenWeatherMap();
          }
        });
    } else {
      this.loadWeatherFromOpenWeatherMap();
    }
  }

  private loadWeatherFromOpenWeatherMap() {
    // OpenWeatherMap - API alternativa
    const apiKey = environment.openWeatherApiKey;
    if (apiKey && apiKey !== 'TU_CLAVE_OPENWEATHER_AQUI') {
      this.http.get<any>(`https://api.openweathermap.org/data/2.5/weather?q=Lima,PE&appid=${apiKey}&units=metric`)
        .subscribe({
          next: (data) => {
            console.log('✅ [WEATHER] Datos obtenidos de OpenWeatherMap:', data);
            const weatherData: WeatherData = {
              location: { name: data.name, country: data.sys.country },
              current: {
                temp_c: Math.round(data.main.temp),
                condition: { 
                  text: data.weather[0].description,
                  icon: `https://openweathermap.org/img/w/${data.weather[0].icon}.png`
                },
                humidity: data.main.humidity,
                wind_kph: Math.round(data.wind.speed * 3.6)
              }
            };
            this.weather.set(weatherData);
          },
          error: (error) => {
            console.warn('⚠️ [WEATHER] Error con OpenWeatherMap, usando datos estáticos:', error);
            this.loadWeatherStatic();
          }
        });
    } else {
      this.loadWeatherStatic();
    }
  }

  private loadWeatherStatic() {
    // Datos estáticos como fallback
    const weatherData: WeatherData = {
      location: { name: 'Lima', country: 'Perú' },
      current: {
        temp_c: 22,
        condition: { 
          text: 'Parcialmente nublado',
          icon: '//cdn.weatherapi.com/weather/64x64/day/116.png'
        },
        humidity: 75,
        wind_kph: 12
      }
    };
    this.weather.set(weatherData);
  }

 
    // NewsAPI - API real de noticias mundiales usando RSS2JSON
  public loadWorldNews() {
    // NewsAPI - API real de noticias mundiales usando RSS2JSON
    this.http.get<any>('https://api.rss2json.com/v1/api.json?rss_url=https://feeds.bbci.co.uk/mundo/rss.xml')
      .subscribe({
        next: (data) => {
          console.log('✅ [NEWS] Noticias obtenidas de RSS2JSON:', data);
          const articles: NewsItem[] = data.items?.slice(0, 5).map((item: any) => ({
            title: item.title,
            description: item.description?.replace(/<[^>]*>/g, '').substring(0, 100) + '...',
            url: item.link,
            urlToImage: item.enclosure?.link || '',
            publishedAt: item.pubDate,
            source: { name: 'BBC Mundo' }
          })) || [];
          this.worldNews.set(articles);
        },
        error: (error) => {
          console.warn('⚠️ [NEWS] Error con RSS2JSON, intentando JSONPlaceholder:', error);
          this.loadNewsFromJSONPlaceholder();
        }
      });
  }

  private loadNewsFromJSONPlaceholder() {
    // JSONPlaceholder como fallback
    this.http.get<any[]>('https://jsonplaceholder.typicode.com/posts?_limit=5')
      .subscribe({
        next: (posts) => {
          console.log('✅ [NEWS] Noticias obtenidas de JSONPlaceholder:', posts);
          const articles: NewsItem[] = posts.map(post => ({
            title: post.title.charAt(0).toUpperCase() + post.title.slice(1),
            description: post.body.substring(0, 100) + '...',
            url: '#',
            urlToImage: '',
            publishedAt: new Date().toISOString(),
            source: { name: 'Noticias Académicas' }
          }));
          this.worldNews.set(articles);
        },
        error: (error) => {
          console.warn('⚠️ [NEWS] Error con JSONPlaceholder, usando noticias estáticas:', error);
          this.loadNewsStatic();
        }
      });
  }

  private loadNewsStatic() {
    // Noticias estáticas como fallback
    const articles: NewsItem[] = [
      {
        title: 'Avances en la Educación Digital',
        description: 'Las nuevas tecnologías están transformando la forma en que aprendemos y enseñamos en las instituciones educativas...',
        url: '#',
        urlToImage: '',
        publishedAt: new Date().toISOString(),
        source: { name: 'Noticias Académicas' }
      },
      {
        title: 'Innovación en el Sistema Educativo',
        description: 'Las metodologías modernas están revolucionando la educación tradicional, mejorando la experiencia de aprendizaje...',
        url: '#',
        urlToImage: '',
        publishedAt: new Date().toISOString(),
        source: { name: 'Noticias Académicas' }
      },
      {
        title: 'Tecnología al Servicio de la Educación',
        description: 'Las herramientas digitales están facilitando el acceso a la educación de calidad para todos los estudiantes...',
        url: '#',
        urlToImage: '',
        publishedAt: new Date().toISOString(),
        source: { name: 'Noticias Académicas' }
      }
    ];
    this.worldNews.set(articles);
  }

  private loadCountryInfo() {
    // REST Countries API - completamente gratuita
    this.http.get<CountryInfo[]>(`${environment.restCountriesApiUrl}/name/peru`)
      .subscribe({
        next: (data) => {
          console.log('✅ [COUNTRY] Información obtenida de REST Countries:', data);
          if (data && data.length > 0) {
            this.countryInfo.set(data[0]);
          }
        },
        error: (error) => {
          console.warn('⚠️ [COUNTRY] Error con REST Countries, usando datos estáticos:', error);
          this.loadCountryStatic();
        }
      });
  }

  private loadCountryStatic() {
    // Información estática de Perú como fallback
    const peruInfo: CountryInfo = {
      name: { common: 'Perú' },
      capital: ['Lima'],
      region: 'Americas',
      population: 32971846,
      flags: { png: 'https://flagcdn.com/w320/pe.png' }
    };
    this.countryInfo.set(peruInfo);
  }

  private loadUpcomingHolidays() {
    // Nager.Date API - días festivos gratuitos
    const currentYear = new Date().getFullYear();
    this.http.get<HolidayInfo[]>(`${environment.holidaysApiUrl}/PublicHolidays/${currentYear}/PE`)
      .subscribe({
        next: (data) => {
          console.log('✅ [HOLIDAYS] Días festivos obtenidos de Nager.Date:', data);
          const now = new Date();
          const upcoming = data
            .filter(holiday => new Date(holiday.date) > now)
            .slice(0, 3);
          this.upcomingHolidays.set(upcoming);
        },
        error: (error) => {
          console.warn('⚠️ [HOLIDAYS] Error con Nager.Date, usando datos estáticos:', error);
          this.loadHolidaysStatic();
        }
      });
  }

  private loadHolidaysStatic() {
    // Días festivos estáticos de Perú como fallback
    const holidays: HolidayInfo[] = [
      {
        date: '2025-01-01',
        localName: 'Año Nuevo',
        name: 'New Year\'s Day',
        countryCode: 'PE'
      },
      {
        date: '2025-04-20',
        localName: 'Domingo de Resurrección',
        name: 'Easter Sunday',
        countryCode: 'PE'
      },
      {
        date: '2025-07-28',
        localName: 'Día de la Independencia',
        name: 'Independence Day',
        countryCode: 'PE'
      }
    ];
    this.upcomingHolidays.set(holidays);
  }

  private loadGlobalTimes() {
    // WorldTimeAPI - zonas horarias gratuitas
    const timeZones = [
      { city: 'Nueva York', zone: 'America/New_York' },
      { city: 'Londres', zone: 'Europe/London' },
      { city: 'Tokio', zone: 'Asia/Tokyo' }
    ];

    timeZones.forEach(tz => {
      this.http.get<any>(`${environment.worldTimeApiUrl}/timezone/${tz.zone}`)
        .subscribe({
          next: (data) => {
            console.log(`✅ [TIME] Hora obtenida para ${tz.city}:`, data);
            const time = new Date(data.datetime).toLocaleTimeString('es-ES', { 
              hour: '2-digit', 
              minute: '2-digit' 
            });
            const current = this.globalTimeZones();
            this.globalTimeZones.set([...current, { city: tz.city, time }]);
          },
          error: (error) => {
            console.warn(`⚠️ [TIME] Error con WorldTimeAPI para ${tz.city}, usando hora estática:`, error);
            this.loadTimeStatic();
          }
        });
    });
  }

  private loadTimeStatic() {
    // Horarios globales estáticos como fallback
    const times = [
      { city: 'Nueva York', time: '10:30 AM' },
      { city: 'Londres', time: '3:30 PM' },
      { city: 'Tokio', time: '11:30 PM' }
    ];
    this.globalTimeZones.set(times);
  }

  getUserPhoto(): string {
    const user = this.currentUser();
    
    // Usar la foto del userStore directamente
    if (user?.photo) {
      return user.photo;
    }
    
    // Fallback: usar la URL real obtenida del backend
    if (user?.idUser) {
      const fallbackUrl = this.realPhotoUrl();
      return fallbackUrl || '';
    }
    
    return '';
  }

  loadUserPhoto(): void {
    const user = this.currentUser();
    if (user?.idUser && !user.photo) {
      this.usuarioService.obtenerUrlFotoPerfil(user.idUser).subscribe({
        next: (response) => {
          if (response.success && response.data?.foto_url) {
            this.realPhotoUrl.set(response.data.foto_url);
          } else {
            this.realPhotoUrl.set('assets/default-avatar.png');
          }
        },
        error: (error) => {
          console.error('Error al cargar foto:', error);
          this.realPhotoUrl.set('assets/default-avatar.png');
        }
      });
    }
  }

  onImageError(event: any): void {
    event.target.style.display = 'none';
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }

  getTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour < 6) return 'Madrugada';
    if (hour < 12) return 'Mañana';
    if (hour < 18) return 'Tarde';
    if (hour < 22) return 'Noche';
    return 'Noche tardía';
  }



  getRoleDisplay(role: string): string {
    const roleMap: { [key: string]: string } = {
      'admin': 'Administrador',
      'user': 'Usuario',
      'student': 'Estudiante',
      'teacher': 'Profesor',
      'auxiliary': 'Auxiliar',
      'moderator': 'Moderador',
      'editor': 'Editor',
      'superadmin': 'Super Admin',
      'manager': 'Manager'
    };
    
    return roleMap[role.toLowerCase()] || role.charAt(0).toUpperCase() + role.slice(1);
  }

  formatNewsDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffHours < 1) return 'Hace menos de 1 hora';
    if (diffHours < 24) return `Hace ${diffHours} horas`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString('es-ES');
  }

  formatHolidayDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Mañana';
    if (diffDays < 30) return `En ${diffDays} días`;
    return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
  }

  formatPopulation(population: number): string {
    if (population >= 1000000) {
      return (population / 1000000).toFixed(1) + 'M';
    }
    if (population >= 1000) {
      return (population / 1000).toFixed(0) + 'K';
    }
    return population.toString();
  }

  openNews(url: string): void {
    if (url && url !== '#') {
      window.open(url, '_blank');
    }
  }
}