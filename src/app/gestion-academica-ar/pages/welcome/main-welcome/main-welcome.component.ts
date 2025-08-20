import { Component, Input, inject, computed, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { UserStoreService } from '../../../../auth/store/user.store';
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

interface QuoteData {
  text: string;
  author: string;
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

interface CryptoPrice {
  id: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
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

  constructor() {
    console.log('🎉 WelcomeComponent: Constructor ejecutado');
  }
  
  // Signals para datos en tiempo real
  currentUser = this.userStore.user;
  weather = signal<WeatherData | null>(null);
  dailyQuote = signal<QuoteData | null>(null);
  worldNews = signal<NewsItem[]>([]);
  cryptoPrices = signal<CryptoPrice[]>([]);
  countryInfo = signal<CountryInfo | null>(null);
  upcomingHolidays = signal<HolidayInfo[]>([]);
  
  // Signals para tiempo y stats en tiempo real
  currentTime = signal<string>('');
  currentDate = signal<string>('');
  sessionTime = signal<string>('0:00');
  globalTimeZones = signal<{city: string, time: string}[]>([]);
  
  private sessionStartTime = Date.now();
  private timeInterval?: number;
  
  // Computed para el nombre a mostrar
  displayName = computed(() => {
    const user = this.currentUser();
    if (!user) return '';
    return user.nombreCompleto || user.username;
  });

  ngOnInit() {
    console.log('🎉 WelcomeComponent: ngOnInit ejecutado');
    this.initializeTimeUpdates();
    this.loadWeatherData();
    this.loadDailyQuote();
    this.loadWorldNews();
    this.loadCryptoPrices();
    this.loadCountryInfo();
    this.loadUpcomingHolidays();
    this.loadGlobalTimes();
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
    // WeatherAPI - API gratuita real
    this.http.get<WeatherData>('https://api.weatherapi.com/v1/current.json?key=demo&q=Lima&aqi=no')
      .subscribe({
        next: (data) => this.weather.set(data),
        error: () => {
          // Usar una API alternativa gratuita: OpenWeatherMap
          this.http.get<any>('https://api.openweathermap.org/data/2.5/weather?q=Lima,PE&appid=demo&units=metric')
            .subscribe({
              next: (data) => {
                this.weather.set({
                  location: { name: data.name, country: data.sys.country },
                  current: {
                    temp_c: Math.round(data.main.temp),
                    condition: { 
                      text: data.weather[0].description,
                      icon: `//openweathermap.org/img/w/${data.weather[0].icon}.png`
                    },
                    humidity: data.main.humidity,
                    wind_kph: Math.round(data.wind.speed * 3.6)
                  }
                });
              },
              error: () => {}
            });
        }
      });
  }

  private loadDailyQuote() {
    // API de Quotable - completamente gratuita y funcional
    this.http.get<{content: string, author: string}>('https://api.quotable.io/random?tags=motivational,education,wisdom')
      .subscribe({
        next: (data) => this.dailyQuote.set({ text: data.content, author: data.author }),
        error: () => {
          // Fallback con frases locales motivacionales
          const quotes = [
            { text: 'La educación es el arma más poderosa que puedes usar para cambiar el mundo.', author: 'Nelson Mandela' },
            { text: 'El éxito es la suma de pequeños esfuerzos repetidos día tras día.', author: 'Robert Collier' },
            { text: 'No esperes el momento perfecto. Toma el momento y hazlo perfecto.', author: 'Zoey Sayward' }
          ];
          this.dailyQuote.set(quotes[Math.floor(Math.random() * quotes.length)]);
        }
      });
  }

 
    // NewsAPI - API real de noticias mundiales usando RSS2JSON
  public loadWorldNews() {
    // NewsAPI - API real de noticias mundiales usando RSS2JSON
    this.http.get<any>('https://api.rss2json.com/v1/api.json?rss_url=https://feeds.bbci.co.uk/mundo/rss.xml')
      .subscribe({
        next: (data) => {
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
        error: () => {
          // Usar JSONPlaceholder para datos de ejemplo
          this.http.get<any[]>('https://jsonplaceholder.typicode.com/posts?_limit=5')
            .subscribe({
              next: (posts) => {
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
              error: () => {}
            });
        }
      });
  }

  private loadCryptoPrices() {
    // CoinGecko API - completamente gratuita
    this.http.get<CryptoPrice[]>('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,cardano&order=market_cap_desc&per_page=3&page=1')
      .subscribe({
        next: (data) => this.cryptoPrices.set(data),
        error: () => {}
      });
  }

  private loadCountryInfo() {
    // REST Countries API - completamente gratuita
    this.http.get<CountryInfo[]>('https://restcountries.com/v3.1/name/peru')
      .subscribe({
        next: (data) => {
          if (data && data.length > 0) {
            this.countryInfo.set(data[0]);
          }
        },
        error: () => {}
      });
  }

  private loadUpcomingHolidays() {
    // Nager.Date API - días festivos gratuitos
    const currentYear = new Date().getFullYear();
    this.http.get<HolidayInfo[]>(`https://date.nager.at/api/v3/PublicHolidays/${currentYear}/PE`)
      .subscribe({
        next: (data) => {
          const now = new Date();
          const upcoming = data
            .filter(holiday => new Date(holiday.date) > now)
            .slice(0, 3);
          this.upcomingHolidays.set(upcoming);
        },
        error: () => {}
      });
  }

  private loadGlobalTimes() {
    // WorldTimeAPI - zonas horarias gratuitas
    const timeZones = [
      { city: 'Nueva York', zone: 'America/New_York' },
      { city: 'Londres', zone: 'Europe/London' },
      { city: 'Tokio', zone: 'Asia/Tokyo' }
    ];

    timeZones.forEach(tz => {
      this.http.get<any>(`https://worldtimeapi.org/api/timezone/${tz.zone}`)
        .subscribe({
          next: (data) => {
            const time = new Date(data.datetime).toLocaleTimeString('es-ES', { 
              hour: '2-digit', 
              minute: '2-digit' 
            });
            const current = this.globalTimeZones();
            this.globalTimeZones.set([...current, { city: tz.city, time }]);
          },
          error: () => {}
        });
    });
  }

  getUserPhoto(): string {
    const user = this.currentUser();
    if (user?.photo && user.photo.trim() !== '') {
      return user.photo;
    }
    return `${environment.apiUrl}/uploads/profiles/no-image.png`;
  }

  onImageError(event: any): void {
    event.target.src = `${environment.apiUrl}/uploads/profiles/no-image.png`;
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

  getPersonalizedMessage(): string {
    if (this.welcomeMessage) return this.welcomeMessage;
    
    const hour = new Date().getHours();
    const user = this.currentUser();
    const firstName = user?.nombreCompleto?.split(' ')[0] || user?.username || '';
    
    const messages = {
      morning: [
        `${firstName}, ¡que tengas un excelente día de aprendizaje! Todo está listo para que alcances tus metas académicas.`,
        `Es un nuevo día lleno de oportunidades, ${firstName}. Tu progreso académico te está esperando.`,
        `¡Perfecto momento para comenzar, ${firstName}! Tienes todo lo necesario para un día productivo.`
      ],
      afternoon: [
        `¡Esperamos que tu día esté siendo productivo, ${firstName}! Continúa con el gran trabajo que vienes realizando.`,
        `La tarde es perfecta para revisar tu progreso, ${firstName}. Sigues avanzando hacia tus objetivos.`,
        `¡Buen trabajo hasta ahora, ${firstName}! Mantén el momentum para terminar el día con éxito.`
      ],
      evening: [
        `¡Buen trabajo hoy, ${firstName}! Es tiempo de revisar lo logrado y planificar el día de mañana.`,
        `La noche es ideal para reflexionar sobre tus logros, ${firstName}. Has hecho un gran progreso.`,
        `${firstName}, tu dedicación es admirable. Aprovecha este momento para organizar tus próximas actividades.`
      ]
    };

    let timeMessages;
    if (hour < 12) timeMessages = messages.morning;
    else if (hour < 18) timeMessages = messages.afternoon;
    else timeMessages = messages.evening;

    return timeMessages[Math.floor(Math.random() * timeMessages.length)];
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

  // Métodos de navegación mejorados
  onGetStarted(): void {
    const user = this.currentUser();
    
    // Ejemplo: this.router.navigate(['/dashboard']);
  }

  onViewCalendar(): void {
    
    // Ejemplo: this.router.navigate(['/calendar']);
  }

  onCheckGrades(): void {
    
    // Ejemplo: this.router.navigate(['/grades']);
  }

  onGetHelp(): void {
    
    // Ejemplo: this.router.navigate(['/support']);
    // O abrir chat de soporte
  }
}