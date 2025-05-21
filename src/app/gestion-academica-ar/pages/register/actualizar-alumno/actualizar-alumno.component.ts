// actualizar-alumno.component.ts
import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Observable, of, Subscription, timer } from 'rxjs';
import { map, startWith, debounceTime, switchMap, catchError, tap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

// Angular Material
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';

// Componentes y servicios
import { TableStudentComponent } from '../../../../shared/components/table/table-student/table-student.component';
import { AlertsService } from '../../../../shared/alerts.service';

// Modelos e interfaces
interface Alumno {
  codigo: string;
  nombre: string;
  apellido: string;
  nivel: string;
  grado: number;
  seccion: string;
  dni_alumno: string;
  fecha_nacimiento: string;
  direccion: string;
  estado?: string;
  ultima_actualizacion?: string;
}

interface HistorialItem {
  codigo: string;
  nombre: string;
  nivel: string;
  timestamp: Date;
}

@Component({
  selector: 'app-actualizar-alumno',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatIconModule,
    MatSelectModule,
    MatButtonModule,
    TableStudentComponent
  ],
  templateUrl: './actualizar-alumno.component.html',
  styleUrls: ['./actualizar-alumno.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActualizarAlumnoComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private alertSvc = inject(AlertsService);
  private cd = inject(ChangeDetectorRef);
  
  // Estado del componente
  editando = false;
  dataLoaded = false;
  selectedCode = '';
  nivelFiltro = '';
  
  // Estadísticas
  totalAlumnos = 0;
  alumnosActivos = 0;
  alumnosInactivos = 0;
  actualizadosHoy = 0;
  
  // Notificaciones
  mostrarNotificacion = false;
  tipoNotificacion: 'success' | 'error' | 'info' = 'info';
  mensajeNotificacion = '';
  private notificacionTimer?: Subscription;
  
  // Datos de alumnos para autocompletado
  alumnosData: Alumno[] = [];
  filteredAlumnos$!: Observable<Alumno[]>;
  searchControl = new FormControl<string>('', { nonNullable: true });
  
  // Historial de búsquedas
  historialBusquedas: HistorialItem[] = [];
  
  // Control de subscripciones
  private subscriptions = new Subscription();

  ngOnInit() {
    // Inicializar el autocompletado
    this.initializeAutocomplete();
    
    // Cargar datos iniciales
    this.cargarEstadisticas();
    this.cargarAlumnos();
    this.cargarHistorialBusquedas();
    
    // Monitorear cambios en filtro
    this.subscriptions.add(
      this.searchControl.valueChanges.pipe(
        debounceTime(300)
      ).subscribe(() => {
        this.cd.markForCheck();
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    if (this.notificacionTimer) {
      this.notificacionTimer.unsubscribe();
    }
  }

  // Inicialización del autocompletado
  private initializeAutocomplete() {
    this.filteredAlumnos$ = this.searchControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        const filterValue = (value || '').toLowerCase();
        
        // Si no hay datos cargados todavía, retornar array vacío
        if (this.alumnosData.length === 0) {
          return [];
        }
        
        // Filtrar por código, nombre o apellido
        return this.alumnosData.filter(alumno => 
          alumno.codigo.toLowerCase().includes(filterValue) ||
          alumno.nombre.toLowerCase().includes(filterValue) ||
          alumno.apellido.toLowerCase().includes(filterValue)
        ).slice(0, 7); // Limitar a 7 resultados para no sobrecargar la UI
      })
    );
  }

  // Carga de datos de alumnos
  private cargarAlumnos() {
    this.subscriptions.add(
      this.http.get<Alumno[]>('http://localhost:3000/alumnos')
        .pipe(
          catchError(error => {
            console.error('Error al cargar alumnos:', error);
            this.mostrarToast('error', 'Error al cargar la lista de alumnos');
            return of([]);
          })
        )
        .subscribe(alumnos => {
          this.alumnosData = alumnos;
          this.cd.markForCheck();
        })
    );
  }

  // Carga de estadísticas
  private cargarEstadisticas() {
    this.subscriptions.add(
      this.http.get<any>('http://localhost:3000/alumnos/estadisticas')
        .pipe(
          catchError(error => {
            console.error('Error al cargar estadísticas:', error);
            return of({
              totalAlumnos: 0,
              alumnosActivos: 0,
              alumnosInactivos: 0,
              actualizadosHoy: 0
            });
          })
        )
        .subscribe(stats => {
          this.totalAlumnos = stats.totalAlumnos || 0;
          this.alumnosActivos = stats.alumnosActivos || 0;
          this.alumnosInactivos = stats.alumnosInactivos || 0;
          this.actualizadosHoy = stats.actualizadosHoy || 0;
          this.cd.markForCheck();
        })
    );
  }

  // Manejo de notificaciones tipo toast
  mostrarToast(tipo: 'success' | 'error' | 'info', mensaje: string, duracion: number = 5000) {
    // Cancelar timer anterior si existe
    if (this.notificacionTimer) {
      this.notificacionTimer.unsubscribe();
    }
    
    // Configurar nueva notificación
    this.tipoNotificacion = tipo;
    this.mensajeNotificacion = mensaje;
    this.mostrarNotificacion = true;
    this.cd.markForCheck();
    
    // Programar auto-cierre
    this.notificacionTimer = timer(duracion).subscribe(() => {
      this.cerrarNotificacion();
    });
  }

  cerrarNotificacion() {
    this.mostrarNotificacion = false;
    this.cd.markForCheck();
  }

  // Gestión de historial de búsqueda
  private cargarHistorialBusquedas() {
    try {
      const historialJson = localStorage.getItem('historialAlumnos');
      if (historialJson) {
        const historial = JSON.parse(historialJson);
        // Validar estructura y convertir timestamp a Date
        if (Array.isArray(historial)) {
          this.historialBusquedas = historial
            .filter(item => item && item.codigo && item.nombre)
            .map(item => ({
              ...item,
              timestamp: new Date(item.timestamp)
            }))
            .slice(0, 5); // Limitar a 5 elementos
        }
      }
    } catch (error) {
      console.error('Error al cargar historial:', error);
      this.historialBusquedas = [];
    }

    this.cd.markForCheck();
  }

  private agregarAlHistorial(alumno: Alumno) {
    // Verificar si ya existe
    const index = this.historialBusquedas.findIndex(i => i.codigo === alumno.codigo);
    
    if (index !== -1) {
      // Si existe, remover para añadirlo al inicio (más reciente)
      this.historialBusquedas.splice(index, 1);
    }
    
    // Añadir al inicio
    this.historialBusquedas.unshift({
      codigo: alumno.codigo,
      nombre: `${alumno.nombre} ${alumno.apellido}`,
      nivel: alumno.nivel,
      timestamp: new Date()
    });
    
    // Limitar a 5 elementos
    if (this.historialBusquedas.length > 5) {
      this.historialBusquedas = this.historialBusquedas.slice(0, 5);
    }
    
    // Guardar en localStorage
    try {
      localStorage.setItem('historialAlumnos', JSON.stringify(this.historialBusquedas));
    } catch (error) {
      console.error('Error al guardar historial:', error);
    }
    
    this.cd.markForCheck();
  }

  // Acciones del usuario
  onSelectCode(code: string) {
    if (this.editando || !code) return;
    
    this.selectedCode = code;
    console.log('Código seleccionado:', code);
    
    // Buscar el alumno en la lista para añadirlo al historial
    const alumno = this.alumnosData.find(a => a.codigo === code);
    if (alumno) {
      this.agregarAlHistorial(alumno);
    }
    
    // Mostrar notificación
    this.mostrarToast('info', `Buscando alumno con código ${code}...`, 2000);
    
    this.cd.markForCheck();
  }

  onAlumnoEditando(state: boolean) {
    this.editando = state;
    this.cd.markForCheck();
  }

  onAlumnoActualizado(alumno: Alumno) {
    // Actualizar estadísticas después de modificar un alumno
    this.cargarEstadisticas();
    
    // Mostrar notificación de éxito
    this.mostrarToast('success', `Alumno ${alumno.nombre} ${alumno.apellido} actualizado correctamente`);
    
    // Actualizar la lista de alumnos
    this.cargarAlumnos();
  }

  seleccionarHistorial(codigo: string) {
    if (this.editando) return;
    
    this.searchControl.setValue(codigo);
    this.onSelectCode(codigo);
  }

  actualizarFiltros() {
    // Esta función se llama cuando cambia el filtro de nivel
    console.log('Filtro de nivel actualizado:', this.nivelFiltro);
    this.cd.markForCheck();
  }

  cargarAlumnosRecientes() {
    this.dataLoaded = true;
    this.http.get<Alumno[]>('http://localhost:3000/alumnos/recientes')
      .pipe(
        catchError(error => {
          console.error('Error al cargar alumnos recientes:', error);
          this.mostrarToast('error', 'Error al cargar alumnos recientes');
          return of([]);
        })
      )
      .subscribe(alumnos => {
        // Enviar datos al componente de tabla
        // Esto depende de cómo esté implementado tu componente de tabla
        this.cd.markForCheck();
        this.mostrarToast('info', `Se cargaron ${alumnos.length} alumnos recientes`);
      });
  }

  exportarDatos() {
    // Simular exportación a CSV/Excel
    if (!this.selectedCode && !this.dataLoaded) {
      this.mostrarToast('error', 'No hay datos para exportar');
      return;
    }

    this.mostrarToast('info', 'Preparando exportación...', 1500);
    
    // Simular procesamiento
    setTimeout(() => {
      this.mostrarToast('success', 'Datos exportados correctamente');
      
      // Aquí iría la lógica real de exportación
      console.log('Exportando datos...');
      
      // Ejemplo de cómo sería una exportación real
      // this.exportService.exportToExcel('alumnos', this.dataSource.data);
    }, 1500);
  }
}