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
  }

  // Búsqueda de alumno
  buscarAlumno() {
    const codigo = this.searchControl.value.trim();
    
    if (!codigo) {
      this.mostrarNotificacionUsuario('Ingrese un código de alumno', 'error');
      return;
    }

    if (codigo.length < 1) {
      this.mostrarNotificacionUsuario('Ingrese un código de alumno válido', 'error');
      return;
    }

    if (this.editando) {
      this.mostrarNotificacionUsuario('Finalice la edición actual antes de buscar otro alumno', 'info');
      return;
    }

    this.buscando = true;
    this.cd.markForCheck();

    this.subscriptions.add(
      this.http.get<AlumnoSearchResponse>(`${environment.apiUrl}/alumnos/codigo/${codigo}`)
        .pipe(catchError(error => {
          this.mostrarNotificacionUsuario('No se encontró ningún alumno con ese código', 'error');
          return of(null);
        }))
        .subscribe(response => {
          this.buscando = false;
          
          if (response && response.success && response.data) {
            this.alumnoEncontrado = response.data;
            this.selectedCode = codigo;
            this.mostrarNotificacionUsuario(`Alumno ${response.data.nombre} ${response.data.apellido} encontrado exitosamente`, 'success');
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
      this.mostrarNotificacionUsuario('Finalice la edición actual antes de limpiar', 'info');
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
      this.mostrarNotificacionUsuario('Modo edición activado', 'info');
    } else {
      this.searchControl.enable();
    }
    
    this.cd.markForCheck();
  }

  // Alumno actualizado
  onAlumnoActualizado(alumno: AlumnoUpdateShared) {
    this.alumnoEncontrado = alumno;
    this.mostrarNotificacionUsuario(`Alumno ${alumno.nombre} ${alumno.apellido} actualizado exitosamente`, 'success');
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

  // Notificaciones con SweetAlert
  private mostrarNotificacionUsuario(mensaje: string, tipo: 'success' | 'error' | 'info'): void {
    switch (tipo) {
      case 'success':
        this.alertSvc.success(mensaje);
        break;
      case 'error':
        this.alertSvc.error(mensaje);
        break;
      case 'info':
        this.alertSvc.info(mensaje);
        break;
    }
  }
}
