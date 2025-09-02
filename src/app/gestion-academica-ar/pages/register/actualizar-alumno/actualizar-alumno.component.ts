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
import { 
  AlumnoUpdateShared, 
  AlumnoSearchResponse, 
  AlumnoUpdateResponse, 
  UpdateAlumnoDto 
} from '../../../../shared/interfaces/alumno-shared.interface';

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
  
  // Estados principales
  selectedCode = '';
  alumnoEncontrado: AlumnoUpdateShared | null = null;
  buscando = false;
  editando = false;
  
  // Controles
  searchControl = new FormControl<string>('', { nonNullable: true });
  nivelFiltro = '';
  
  // Notificaciones
  mostrarNotificacion = false;
  tipoNotificacion: 'success' | 'error' | 'info' = 'info';
  mensajeNotificacion = '';
  private notificacionTimer?: Subscription;
  
  // Datos
  nivelesEducativos = ['Inicial', 'Primaria', 'Secundaria'];
  private subscriptions = new Subscription();

  ngOnInit() {
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

  // Búsqueda de alumno
  buscarAlumno() {
    const codigo = this.searchControl.value.trim();
    
    if (!codigo) {
      this.mostrarToast('error', 'Ingrese un código de alumno');
      return;
    }

    if (codigo.length < 1) {
      this.mostrarToast('error', 'Ingrese un código de alumno válido');
      return;
    }

    if (this.editando) {
      this.mostrarToast('info', 'Finalice la edición actual antes de buscar otro alumno');
      return;
    }

    this.buscando = true;
    this.cd.markForCheck();

    this.subscriptions.add(
      this.http.get<AlumnoSearchResponse>(`${environment.apiUrl}/alumnos/codigo/${codigo}`)
        .pipe(catchError(error => {
          this.mostrarToast('error', 'No se encontró ningún alumno con ese código');
          return of(null);
        }))
        .subscribe(response => {
          this.buscando = false;
          
          if (response && response.success && response.data) {
            this.alumnoEncontrado = response.data;
            this.selectedCode = codigo;
            this.mostrarToast('success', `Alumno ${response.data.nombre} ${response.data.apellido} encontrado exitosamente`);
          } else {
            this.alumnoEncontrado = null;
            this.selectedCode = '';
          }
          
          this.cd.markForCheck();
        })
    );
  }

  // Limpiar búsqueda
  limpiarBusqueda() {
    if (this.editando) {
      this.mostrarToast('info', 'Finalice la edición actual antes de limpiar');
      return;
    }
    
    this.searchControl.setValue('');
    this.selectedCode = '';
    this.alumnoEncontrado = null;
    this.cd.markForCheck();
  }

  // Manejo de edición
  onAlumnoEditando(state: boolean) {
    this.editando = state;
    
    if (state) {
      this.searchControl.disable();
      this.mostrarToast('info', 'Modo edición activado');
    } else {
      this.searchControl.enable();
    }
    
    this.cd.markForCheck();
  }

  // Alumno actualizado
  onAlumnoActualizado(alumno: AlumnoUpdateShared) {
    this.alumnoEncontrado = alumno;
    this.mostrarToast('success', `Alumno ${alumno.nombre} ${alumno.apellido} actualizado exitosamente`);
  }

  // Filtros
  actualizarFiltros() {
    this.cd.markForCheck();
  }

  // Validación de entrada
  onCodigoInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const valor = input.value;
    input.value = valor.replace(/[^0-9]/g, '');
    if (input.value.length > 14) {
      input.value = input.value.slice(0, 14);
    }
    this.searchControl.setValue(input.value);
  }

  // Notificaciones
  mostrarToast(tipo: 'success' | 'error' | 'info', mensaje: string, duracion: number = 4000) {
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
}
