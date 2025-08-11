import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Observable, of, Subscription, timer } from 'rxjs';
import { map, startWith, debounceTime, catchError } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { TableStudentComponent } from '../../../../shared/components/table/table-student/table-student.component';
import { AlertsService } from '../../../../shared/alerts.service';
import { environment } from '../../../../../environments/environment';

export interface Turno {
  id_turno: string;
  hora_inicio: string;
  hora_fin: string;
  hora_limite: string;
  turno: string;
}

export interface Usuario {
  id_user: string;
  nombre_usuario: string;
  password_user: string;
  rol_usuario: string;
  profile_image: string;
}

export interface AlumnoUpdate {
  id_alumno: string;
  codigo: string;
  dni_alumno: string;
  nombre: string;
  apellido: string;
  fecha_nacimiento: Date;
  direccion: string;
  codigo_qr?: string;
  nivel: string;
  grado: number;
  seccion: string;
  turno?: Turno;
  usuario?: Usuario;
}

interface AlumnoUpdateResponse {
  alumno: AlumnoUpdate;
  message: string;
}

interface UpdateAlumnoDto {
  codigo: string;
  dni_alumno: string;
  nombre: string;
  apellido: string;
  fecha_nacimiento: Date;
  direccion: string;
  codigo_qr?: string;
  nivel: string;
  grado: number;
  seccion: string;
  id_turno?: string;
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
  imports: [CommonModule, ReactiveFormsModule, FormsModule, TableStudentComponent],
  templateUrl: './actualizar-alumno.component.html',
  styleUrls: ['./actualizar-alumno.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActualizarAlumnoComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private alertSvc = inject(AlertsService);
  private cd = inject(ChangeDetectorRef);
  
  editando = false;
  selectedCode = '';
  nivelFiltro = '';
  alumnoEncontrado: AlumnoUpdate | null = null;
  buscando = false;
  mostrarSugerencias = false;
  mostrarNotificacion = false;
  tipoNotificacion: 'success' | 'error' | 'info' = 'info';
  mensajeNotificacion = '';
  private notificacionTimer?: Subscription;
  searchControl = new FormControl<string>('', { nonNullable: true });
  historialBusquedas: HistorialItem[] = [];
  private subscriptions = new Subscription();
  nivelesEducativos = ['Inicial', 'Primaria', 'Secundaria'];

  ngOnInit() {
    this.cargarHistorialBusquedas();
    this.subscriptions.add(
      this.searchControl.valueChanges.pipe(debounceTime(300)).subscribe(() => {
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

  buscarAlumno(codigo: string) {
    if (!codigo || codigo.length !== 14 || this.editando) {
      if (codigo && codigo.length !== 14) {
        this.mostrarToast('error', 'El código debe tener exactamente 14 caracteres');
      }
      return;
    }

    this.buscando = true;
    this.cd.markForCheck();

    this.subscriptions.add(
      this.http.get<AlumnoUpdate>(`${environment.apiUrl}/alumnos/codigo/${codigo}`)
        .pipe(catchError(error => {
          console.error('Error al buscar alumno:', error);
          this.mostrarToast('error', 'No se encontró ningún alumno con ese código');
          return of(null);
        }))
        .subscribe(alumno => {
          this.buscando = false;
          if (alumno) {
            this.alumnoEncontrado = alumno;
            this.selectedCode = codigo;
            this.agregarAlHistorial(alumno);
            let mensaje = `Alumno ${alumno.nombre} ${alumno.apellido} encontrado`;
            if (alumno.turno) {
              mensaje += ` - Turno: ${alumno.turno.turno}`;
            }
            this.mostrarToast('success', mensaje);
          } else {
            this.alumnoEncontrado = null;
            this.selectedCode = '';
          }
          this.cd.markForCheck();
        })
    );
  }

  actualizarAlumno(updateData: UpdateAlumnoDto) {
    if (!this.selectedCode) return;
    this.subscriptions.add(
      this.http.put<AlumnoUpdateResponse>(`${environment.apiUrl}/alumnos/actualizar/${this.selectedCode}`, updateData)
        .pipe(catchError(error => {
          console.error('Error al actualizar alumno:', error);
          this.mostrarToast('error', 'Error al actualizar el alumno');
          return of(null);
        }))
        .subscribe(response => {
          if (response) {
            this.alumnoEncontrado = response.alumno;
            this.mostrarToast('success', response.message);
            this.cd.markForCheck();
          }
        })
    );
  }

  mostrarToast(tipo: 'success' | 'error' | 'info', mensaje: string, duracion: number = 5000) {
    if (this.notificacionTimer) {
      this.notificacionTimer.unsubscribe();
    }
    this.tipoNotificacion = tipo;
    this.mensajeNotificacion = mensaje;
    this.mostrarNotificacion = true;
    this.cd.markForCheck();
    this.notificacionTimer = timer(duracion).subscribe(() => {
      this.cerrarNotificacion();
    });
  }

  cerrarNotificacion() {
    this.mostrarNotificacion = false;
    this.cd.markForCheck();
  }

  private cargarHistorialBusquedas() {
    try {
      const historialJson = localStorage.getItem('historialAlumnos');
      if (historialJson) {
        const historial = JSON.parse(historialJson);
        if (Array.isArray(historial)) {
          this.historialBusquedas = historial
            .filter(item => item && item.codigo && item.nombre)
            .map(item => ({ ...item, timestamp: new Date(item.timestamp) }))
            .slice(0, 5);
        }
      }
    } catch (error) {
      console.error('Error al cargar historial:', error);
      this.historialBusquedas = [];
    }
    this.cd.markForCheck();
  }

  private agregarAlHistorial(alumno: AlumnoUpdate) {
    const index = this.historialBusquedas.findIndex(i => i.codigo === alumno.codigo);
    if (index !== -1) {
      this.historialBusquedas.splice(index, 1);
    }
    this.historialBusquedas.unshift({
      codigo: alumno.codigo,
      nombre: `${alumno.nombre} ${alumno.apellido}`,
      nivel: alumno.nivel,
      timestamp: new Date()
    });
    if (this.historialBusquedas.length > 5) {
      this.historialBusquedas = this.historialBusquedas.slice(0, 5);
    }
    try {
      localStorage.setItem('historialAlumnos', JSON.stringify(this.historialBusquedas));
    } catch (error) {
      console.error('Error al guardar historial:', error);
    }
    this.cd.markForCheck();
  }

  onSelectCode() {
    const code = this.searchControl.value.trim();
    if (code) {
      this.buscarAlumno(code);
    }
  }

  onAlumnoEditando(state: boolean) {
    this.editando = state;
    this.cd.markForCheck();
  }

  onAlumnoActualizado(alumno: AlumnoUpdate) {
    this.alumnoEncontrado = alumno;
    let mensaje = `Alumno ${alumno.nombre} ${alumno.apellido} actualizado correctamente`;
    if (alumno.turno) {
      mensaje += ` - Turno: ${alumno.turno.turno}`;
    }
    this.mostrarToast('success', mensaje);
  }

  seleccionarHistorial(codigo: string) {
    if (this.editando) return;
    this.searchControl.setValue(codigo);
    this.buscarAlumno(codigo);
  }

  actualizarFiltros() {
    console.log('Filtro de nivel actualizado:', this.nivelFiltro);
    this.cd.markForCheck();
  }

  limpiarBusqueda() {
    this.searchControl.setValue('');
    this.selectedCode = '';
    this.alumnoEncontrado = null;
    this.cd.markForCheck();
  }

  onCodigoInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const valor = input.value;
    input.value = valor.replace(/[^0-9]/g, '');
    if (input.value.length > 14) {
      input.value = input.value.slice(0, 14);
    }
    this.searchControl.setValue(input.value);
  }
}
