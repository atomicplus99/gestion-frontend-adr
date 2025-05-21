// deleteAlumno.component.ts
import { ChangeDetectionStrategy, Component, ElementRef, HostListener, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { catchError, delay, finalize, tap } from 'rxjs/operators';
import { Observable, of, throwError, Subscription } from 'rxjs';
import { AlertsService } from '../../../../shared/alerts.service';

interface Alumno {
  codigo: string;
  nombre: string;
  apellido: string;
  estado: 'activo' | 'inactivo';
  ultimaActualizacion?: Date;
  ultimaObservacion?: string;
}

interface HistorialItem {
  codigo: string;
  nombre: string;
  timestamp: Date;
}

interface PlantillaObservacion {
  nombre: string;
  texto: string;
}

@Component({
  selector: 'app-delete-alumno',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatSelectModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    MatCardModule,
    ReactiveFormsModule,
    DatePipe
  ],
  templateUrl: './deleteAlumno.component.html',
  styleUrl: './deleteAlumno.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteAlumnoComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private alerts = inject(AlertsService);
  private el = inject(ElementRef);

  // Estado del componente
  codigo = '';
  alumnoEncontrado = signal<Alumno | null>(null);
  mostrarFormulario = signal(false);
  estadoSeleccionado = signal<'activo' | 'inactivo'>('activo');
  observacion = signal('');
  cargando = signal(false);
  errorMensaje = signal<string | null>(null);
  
  // Estado UI adicional
  mostrarAyuda = false;
  mostrarConfirmacion = false;
  confirmacionFinal = false;
  esPreview = false;
  loadingMessage = 'Buscando alumno...';
  private keydownListener: any;
  
  // Historial de búsquedas (máximo 5)
  historialBusquedas: HistorialItem[] = [];
  
  // Plantillas para observaciones
  plantillasObservacion: PlantillaObservacion[] = [
    { nombre: 'Traslado', texto: 'Alumno trasladado a otra institución educativa.' },
    { nombre: 'Abandono', texto: 'Alumno abandonó los estudios sin notificación formal.' },
    { nombre: 'Disciplina', texto: 'Suspensión disciplinaria según reglamento institucional.' },
    { nombre: 'Documentación', texto: 'Pendiente actualización de documentación requerida.' },
  ];
  
  estados: ('activo' | 'inactivo')[] = ['activo', 'inactivo'];
  private subscriptions = new Subscription();

  ngOnInit() {
    // Cargar historial de búsquedas del localStorage
    this.cargarHistorial();
    
    // Añadir soporte para teclas de acceso rápido
    this.keydownListener = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        this.resetFormulario();
      } else if (event.altKey && event.key.toLowerCase() === 's') {
        // Alt+S para guardar
        if (this.mostrarFormulario() && 
            !((this.estadoSeleccionado() === 'inactivo' && this.observacionInvalida()) || 
              (this.alumnoEncontrado()?.estado === this.estadoSeleccionado() && !this.observacion().trim()))) {
          this.confirmarGuardar(true);
          event.preventDefault();
        }
      } else if (event.altKey && event.key.toLowerCase() === 'h') {
        // Alt+H para ayuda
        this.toggleHelp();
        event.preventDefault();
      }
    };
    
    document.addEventListener('keydown', this.keydownListener);
    
    // Enfocar el campo de código al cargar
    setTimeout(() => {
      const inputElement = document.getElementById('codigo-input');
      if (inputElement) inputElement.focus();
    }, 300);
  }
  
  ngOnDestroy() {
    // Limpiar event listeners y subscripciones
    document.removeEventListener('keydown', this.keydownListener);
    this.subscriptions.unsubscribe();
  }
  
  @HostListener('window:beforeunload', ['$event'])
  confirmPageUnload($event: BeforeUnloadEvent) {
    // Si hay cambios pendientes, mostrar confirmación antes de salir
    if (this.hayCambiosPendientes()) {
      $event.returnValue = '¿Está seguro que desea salir? Los cambios no guardados se perderán.';
      return $event.returnValue;
    }
    return true;
  }
  
  hayCambiosPendientes(): boolean {
    if (!this.mostrarFormulario()) return false;
    
    return this.alumnoEncontrado()?.estado !== this.estadoSeleccionado() || 
           this.observacion().trim().length > 0;
  }
  
  // Validaciones
  codigoInvalido(): boolean {
    return this.codigo.length > 0 && this.codigo.length !== 14;
  }

  observacionInvalida(): boolean {
    return this.estadoSeleccionado() === 'inactivo' && !this.observacion().trim();
  }
  
  // Formatear el código para que solo acepte números
  onCodigoChange(event: any): void {
    const input = event.target;
    const value = input.value;
    
    // Remover caracteres no numéricos
    input.value = value.replace(/[^0-9]/g, '');
    
    // Actualizar el modelo
    this.codigo = input.value;
  }

  buscarAlumno(): void {
    if (!this.codigo || this.codigo.length !== 14) {
      this.alerts.error('El código debe tener 10 dígitos');
      return;
    }

    this.cargando.set(true);
    this.errorMensaje.set(null);
    this.loadingMessage = 'Buscando alumno...';
    
    this.http.get<Alumno>(`http://localhost:3000/alumnos/codigo/${this.codigo}`)
      .pipe(
        delay(500), // Pequeño delay para mostrar la animación de carga
        tap(alumno => {
          // Simular campo de última actualización si no existe
          if (!alumno.ultimaActualizacion) {
            alumno.ultimaActualizacion = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
          }
        }),
        catchError((error: HttpErrorResponse) => {
          // Mejorar manejo de errores con información específica
          let errorMsg = 'No se pudo encontrar el alumno con el código proporcionado';
          
          if (error.status === 0) {
            errorMsg = 'No se pudo conectar con el servidor. Verifique su conexión.';
          } else if (error.status === 404) {
            errorMsg = `No existe un alumno con el código ${this.codigo}`;
          } else if (error.status >= 500) {
            errorMsg = 'Error en el servidor. Intente más tarde.';
          }
          
          return throwError(() => new Error(errorMsg));
        }),
        finalize(() => this.cargando.set(false))
      )
      .subscribe({
        next: (alumno) => {
          this.alumnoEncontrado.set(alumno);
          this.estadoSeleccionado.set(alumno.estado || 'activo');
          this.observacion.set('');
          this.mostrarFormulario.set(true);
          this.errorMensaje.set(null);
          
          // Guardar en historial
          this.agregarAlHistorial({
            codigo: alumno.codigo,
            nombre: `${alumno.nombre} ${alumno.apellido}`,
            timestamp: new Date()
          });
          
          setTimeout(() => document.getElementById('estado-select')?.focus(), 100);
          this.alerts.success('Alumno encontrado correctamente');
        },
        error: (error: Error) => {
          this.mostrarFormulario.set(false);
          this.errorMensaje.set(error.message);
          this.alerts.error(error.message);
        }
      });
  }
  
  confirmarGuardar(guardar: boolean): void {
    this.mostrarConfirmacion = true;
    this.esPreview = !guardar;
    this.confirmacionFinal = false;
  }

  guardarCambios(): void {
    const estado = this.estadoSeleccionado();
    const obs = this.observacion().trim();

    if (estado === 'inactivo' && !obs) {
      this.alerts.error('Debes indicar una observación para inactivar al alumno.');
      return;
    }
    
    // Indicar que estamos en modo de confirmación final
    this.confirmacionFinal = true;
    this.cargando.set(true);
    this.loadingMessage = 'Guardando cambios...';
    
    const payload = {
      estado,
      observacion: obs || 'Cambio de estado sin observación'
    };

    this.http.put<Alumno>(`http://localhost:3000/alumnos/estado/${this.codigo}`, payload)
      .pipe(
        delay(800), // Pequeño delay para mostrar la animación de guardado
        finalize(() => {
          this.cargando.set(false);
          this.mostrarConfirmacion = false;
        })
      )
      .subscribe({
        next: (response) => {
          // Actualizar con datos frescos
          if (response) {
            this.alumnoEncontrado.set(response);
          } else {
            // Si la respuesta no incluye los datos del alumno, actualizar el estado localmente
            const alumno = this.alumnoEncontrado();
            if (alumno) {
              alumno.estado = estado;
              alumno.ultimaActualizacion = new Date();
              alumno.ultimaObservacion = obs;
              this.alumnoEncontrado.set({...alumno});
            }
          }
          
          this.estadoSeleccionado.set(estado);
          this.observacion.set('');
          
          // Mostrar notificación de éxito con detalles
          this.alerts.success(`El estado del alumno ha sido actualizado a: ${estado}`);
          
          // Opcional: resetear formulario después de unos segundos
          setTimeout(() => {
            this.resetFormulario();
          }, 2000);
        },
        error: (error: HttpErrorResponse) => {
          let mensaje = 'Error al actualizar el estado';
          
          if (error.status === 0) {
            mensaje = 'Servidor no disponible. Verifique su conexión.';
          } else if (error.status === 401 || error.status === 403) {
            mensaje = 'No tiene permisos para realizar esta acción.';
          } else if (error.status === 404) {
            mensaje = 'El alumno ya no existe en el sistema.';
          } else if (error.status >= 500) {
            mensaje = 'Error interno del servidor. Intente más tarde.';
          } else if (error.error && typeof error.error === 'object' && error.error.message) {
            mensaje = error.error.message;
          }
          
          this.alerts.error(mensaje);
        }
      });
  }

  resetFormulario(): void {
    this.codigo = '';
    this.alumnoEncontrado.set(null);
    this.mostrarFormulario.set(false);
    this.estadoSeleccionado.set('activo');
    this.observacion.set('');
    this.errorMensaje.set(null);
    this.mostrarConfirmacion = false;
    
    // Focus en el campo de código
    setTimeout(() => document.getElementById('codigo-input')?.focus(), 100);
  }
  
  // Gestión de historial de búsquedas
  cargarHistorial(): void {
    try {
      const historialJson = localStorage.getItem('alumnosHistorial');
      if (historialJson) {
        const historial = JSON.parse(historialJson);
        
        // Validar estructura y convertir strings de fecha a objetos Date
        if (Array.isArray(historial)) {
          this.historialBusquedas = historial
            .filter(item => item && item.codigo && item.nombre && item.timestamp)
            .map(item => ({
              ...item,
              timestamp: new Date(item.timestamp)
            }))
            .slice(0, 5); // Limitar a 5 elementos
        }
      }
    } catch (error) {
      console.error('Error al cargar historial de búsquedas:', error);
      // Resetear historial si hay error
      this.historialBusquedas = [];
      localStorage.removeItem('alumnosHistorial');
    }
  }
  
  agregarAlHistorial(item: HistorialItem): void {
    // Verificar si ya existe
    const index = this.historialBusquedas.findIndex(i => i.codigo === item.codigo);
    
    if (index !== -1) {
      // Si existe, remover para añadirlo al inicio (más reciente)
      this.historialBusquedas.splice(index, 1);
    }
    
    // Añadir al inicio
    this.historialBusquedas.unshift(item);
    
    // Limitar a 5 elementos
    if (this.historialBusquedas.length > 5) {
      this.historialBusquedas = this.historialBusquedas.slice(0, 5);
    }
    
    // Guardar en localStorage
    try {
      localStorage.setItem('alumnosHistorial', JSON.stringify(this.historialBusquedas));
    } catch (error) {
      console.error('Error al guardar historial:', error);
    }
  }
  
  seleccionarCodigoBusqueda(codigo: string): void {
    this.codigo = codigo;
    this.buscarAlumno();
  }
  
  // Manejo de plantillas de observación
  aplicarPlantilla(plantilla: PlantillaObservacion): void {
    this.observacion.set(plantilla.texto);
    
    // Enfocar el textarea después de aplicar la plantilla
    setTimeout(() => {
      const textarea = document.getElementById('observacion-textarea');
      if (textarea) {
        textarea.focus();
        // Posicionar cursor al final
        const len = plantilla.texto.length;
        (textarea as HTMLTextAreaElement).setSelectionRange(len, len);
      }
    }, 100);
  }
  
  // Toggle para mostrar/ocultar ayuda
  toggleHelp(): void {
    this.mostrarAyuda = !this.mostrarAyuda;
  }
}