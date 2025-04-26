import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { AlertsService } from '../../../../shared/alerts.service';


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
    ReactiveFormsModule
  ],
  templateUrl: './deleteAlumno.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteAlumnoComponent {
  private http = inject(HttpClient);
  private alerts = inject(AlertsService);

  codigo = '';
  alumnoEncontrado = signal<any | null>(null);
  mostrarFormulario = signal(false);
  estadoSeleccionado = signal<'activo' | 'inactivo'>('activo');
  observacion = signal('');
  estados: ('activo' | 'inactivo')[] = ['activo', 'inactivo'];

  buscarAlumno() {
    if (!this.codigo || this.codigo.length !== 10) {
      this.alerts.error('El código debe tener 10 dígitos');
      return;
    }

    this.http.get<any>(`http://localhost:3000/alumnos/codigo/${this.codigo}`).subscribe({
      next: (alumno) => {
        this.alumnoEncontrado.set(alumno);
        this.estadoSeleccionado.set('activo');
        this.observacion.set('');
        this.mostrarFormulario.set(true);
        setTimeout(() => document.getElementById('estado-select')?.focus(), 100);
        this.alerts.success('Alumno encontrado correctamente');
      },
      error: () => {
        this.alerts.error('Alumno no encontrado');
        this.mostrarFormulario.set(false);
      }
    });
  }

  guardarCambios() {
    const estado = this.estadoSeleccionado();
    const obs = this.observacion().trim();

    if (estado === 'inactivo' && !obs) {
      this.alerts.error('Debes indicar una observación para inactivar al alumno.');
      return;
    }

    const payload = {
      estado,
      observacion: obs || 'Cambio de estado sin observación'
    };

    this.http.put(`http://localhost:3000/alumnos/estado/${this.codigo}`, payload).subscribe({
      next: () => {
        this.alerts.success('Estado actualizado correctamente');
        this.resetFormulario();
      },
      error: () => {
        this.alerts.error('Error al actualizar el estado');
      }
    });
  }

  resetFormulario() {
    this.codigo = '';
    this.alumnoEncontrado.set(null);
    this.mostrarFormulario.set(false);
    this.estadoSeleccionado.set('activo');
    this.observacion.set('');
  }
}
