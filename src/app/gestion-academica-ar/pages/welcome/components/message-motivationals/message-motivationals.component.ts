// motivational-message.component.ts
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { catchError, finalize, Observable, of, tap } from 'rxjs';
import { trigger, transition, style, animate, state } from '@angular/animations';

interface MensajeMotivacional {
    id: string;
    mensaje: string;
    autor?: string;
    categoria?: string;
}

@Component({
    selector: 'app-motivational-message',
    standalone: true,
    imports: [CommonModule, HttpClientModule],
    template: `
    <div class="motivational-container" [class.loading]="loading" [@messageState]="animationState">
      <div *ngIf="loading" class="loading-spinner">
        <div class="spinner"></div>
      </div>
      
      <div *ngIf="error" class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        <p>{{errorMessage}}</p>
        <button (click)="loadRandomMessage()">Reintentar</button>
      </div>
      
      <div *ngIf="!loading && !error" class="message-content">
        <blockquote>
          <p>{{mensaje?.mensaje || defaultMessage}}</p>
          <footer *ngIf="mensaje?.autor">— {{mensaje?.autor}}</footer>
          <div *ngIf="mensaje?.categoria" class="message-category" [attr.data-category]="mensaje?.categoria">
            {{mensaje?.categoria | titlecase}}
          </div>
        </blockquote>
        
        <button *ngIf="showRefreshButton" class="refresh-button" (click)="refreshMessage()" [disabled]="loading">
          <i class="fas fa-sync-alt"></i>
        </button>
      </div>
    </div>
  `,
    styles: [`
         :host {
  display: block;
  width: 100%;
  margin: 0;
  padding: 0;
}

.motivational-container {
  background: linear-gradient(135deg, #6B8DF2, #4285F4);
  border-radius: 0;
  padding: 1.5rem;
  position: relative;
  overflow: hidden;
  color: white;
  box-shadow: none;
  min-height: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  width: 100%;
  margin: 0;
}

.motivational-container::before {
  content: '"';
  position: absolute;
  top: -20px;
  left: 10px;
  font-size: 150px;
  font-family: Georgia, serif;
  opacity: 0.1;
  color: white;
}

.motivational-container.loading {
  background: linear-gradient(135deg, #8eacff, #5a9cff);
}

.loading-spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-left-color: white;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.message-content {
  width: 100%;
  position: relative;
  text-align: center;
}

blockquote {
  margin: 0;
  padding: 0;
  position: relative;
  font-style: italic;
}

blockquote p {
  font-size: 1rem;
  line-height: 1.5;
  margin: 0 0 0.8rem 0;
  font-weight: 300;
  letter-spacing: 0.3px;
  text-align: center;
}

blockquote footer {
  font-size: 0.9rem;
  font-weight: 500;
  text-align: right;
  opacity: 0.9;
  margin-top: 0.5rem;
}

.message-category {
  position: absolute;
  top: -10px;
  right: 0;
  background: rgba(255, 255, 255, 0.2);
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-weight: 500;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.refresh-button {
  position: absolute;
  bottom: -15px;
  right: 0;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.refresh-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(15deg);
}

.refresh-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-message {
  text-align: center;
  padding: 1rem;
}

.error-message i {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.error-message p {
  margin: 0 0 1rem 0;
}

.error-message button {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  cursor: pointer;
  transition: background 0.2s;
}

.error-message button:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Variaciones de color según categoría */
.motivational-container[data-category="motivacion"] {
  background: linear-gradient(135deg, #6B8DF2, #4285F4);
}

.motivational-container[data-category="educacion"] {
  background: linear-gradient(135deg, #26C6DA, #00ACC1);
}

.motivational-container[data-category="superacion"] {
  background: linear-gradient(135deg, #66BB6A, #43A047);
}

.motivational-container[data-category="perseverancia"] {
  background: linear-gradient(135deg, #FFA726, #FB8C00);
}

.motivational-container[data-category="exito"] {
  background: linear-gradient(135deg, #EC407A, #D81B60);
}

.motivational-container[data-category="actitud"] {
  background: linear-gradient(135deg, #AB47BC, #8E24AA);
}

/* Responsive */
@media (max-width: 768px) {
  .motivational-container {
    padding: 1rem;
  }
  
  blockquote p {
    font-size: 0.9rem;
  }
}
    
  `],
    animations: [
        trigger('messageState', [
            state('void', style({
                opacity: 0,
                transform: 'translateY(20px)'
            })),
            state('enter', style({
                opacity: 1,
                transform: 'translateY(0)'
            })),
            state('leave', style({
                opacity: 0,
                transform: 'translateY(-20px)'
            })),
            transition('void => enter', animate('400ms ease-out')),
            transition('enter => leave', animate('300ms ease-in')),
            transition('leave => enter', animate('400ms ease-out'))
        ])
    ]
})
export class MotivationalMessageComponent implements OnInit {
    @Input() showRefreshButton: boolean = true;
    @Input() autoRefreshInterval: number = 0; // En milisegundos, 0 para deshabilitar
    @Input() defaultMessage: string = 'La inspiración existe, pero tiene que encontrarte trabajando.';
    @Output() messageLoaded = new EventEmitter<MensajeMotivacional>();

    mensaje: MensajeMotivacional | null = null;
    loading: boolean = true;
    error: boolean = false;
    errorMessage: string = 'No pudimos cargar un mensaje motivacional.';
    animationState: 'enter' | 'leave' = 'enter';

    private apiUrl: string = 'http://localhost:3000/api/tips/random';
    private refreshTimer: any;

    constructor(private http: HttpClient) { }

    ngOnInit(): void {
        this.loadRandomMessage();

        // Configurar auto-refresh si está habilitado
        if (this.autoRefreshInterval > 0) {
            this.refreshTimer = setInterval(() => {
                this.refreshMessage();
            }, this.autoRefreshInterval);
        }
    }

    ngOnDestroy(): void {
        // Limpiar el timer cuando el componente se destruye
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }
    }

    loadRandomMessage(): void {
        this.loading = true;
        this.error = false;

        this.getRandomMessage().subscribe({
            next: (mensaje) => {
                // Transición de animación
                this.animationState = 'leave';

                setTimeout(() => {
                    this.mensaje = mensaje;
                    this.messageLoaded.emit(mensaje);
                    this.animationState = 'enter';
                }, 300); // Tiempo que coincide con la duración de la animación
            },
            error: (err) => {
                console.error('Error al cargar mensaje motivacional:', err);
                this.error = true;
                this.loading = false;

                if (err.status === 404) {
                    this.errorMessage = 'No hay mensajes motivacionales disponibles.';
                } else {
                    this.errorMessage = 'No pudimos cargar un mensaje motivacional.';
                }
            }
        });
    }

    refreshMessage(): void {
        this.loadRandomMessage();
    }

    private getRandomMessage(): Observable<MensajeMotivacional> {
        return this.http.get<MensajeMotivacional>(this.apiUrl).pipe(
            tap(() => {
                this.loading = true;
            }),
            catchError(error => {
                this.error = true;
                return of(error);
            }),
            finalize(() => {
                this.loading = false;
            })
        );
    }
}