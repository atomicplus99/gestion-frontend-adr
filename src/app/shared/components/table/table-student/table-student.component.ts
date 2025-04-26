// ✅ table-student.component.ts

import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';

import { AlumnoService } from '../../../../gestion-academica-ar/services/alumno.service';
import { PersonalAlumno } from '../../../../gestion-academica-ar/pages/register/interfaces/alumno.interface';
import { AlertsService } from '../../../alerts.service';


@Component({
  selector: 'shared-table-student',
  templateUrl: './table-student.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './table-student.component.css',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule
  ]
})
export class TableStudentComponent implements OnChanges {
  @Input() codigoSeleccionado!: string;
  @Output() editandoAlumno = new EventEmitter<boolean>();

  displayedColumns: string[] = [
    'codigo',
    'dni_alumno',
    'nombre',
    'apellido',
    'fecha_nacimiento',
    'direccion',
    'nivel',
    'grado',
    'seccion',
    'acciones'
  ];

  dataSource = new MatTableDataSource<PersonalAlumno>([]);
  alumnoEditando: PersonalAlumno | null = null;
  secciones: string[] = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
  loading = false;
  codigoOriginal!: string;

  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort!: MatSort;

  constructor(
    private alumnoSvc: AlumnoService,
    private cd: ChangeDetectorRef,
    private http: HttpClient,
    private alerts: AlertsService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['codigoSeleccionado'] && this.codigoSeleccionado) {
      this.fetchAlumno(this.codigoSeleccionado);
    }
  }

  private fetchAlumno(codigo: string) {
    this.loading = true;
    this.alumnoSvc.getByCodigo(codigo).subscribe({
      next: alumno => {
        this.dataSource.data = [alumno];
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.loading = false;
        this.cd.markForCheck();
      },
      error: () => {
        this.dataSource.data = [];
        this.loading = false;
        this.cd.markForCheck();
      }
    });
  }

  editarAlumno(alumno: PersonalAlumno): void {
    this.alumnoEditando = { ...alumno };
    this.codigoOriginal = alumno.codigo; // 👈 Código original para la URL
    this.editandoAlumno.emit(true);
  }

  cancelarEdicion(): void {
    this.alumnoEditando = null;
    this.editandoAlumno.emit(false);
  }

  guardarEdicion(): void {
    if (!this.alumnoEditando) return;

    const payload: any = {
      codigo: this.alumnoEditando.codigo,
      dni_alumno: this.alumnoEditando.dni_alumno,
      nombre: this.alumnoEditando.nombre,
      apellido: this.alumnoEditando.apellido,
      fecha_nacimiento: new Date(this.alumnoEditando.fecha_nacimiento).toISOString().split('T')[0],
      direccion: this.alumnoEditando.direccion,
      nivel: this.alumnoEditando.nivel,
      grado: this.alumnoEditando.grado,
      seccion: this.alumnoEditando.seccion,
    };

    this.http.put(`http://localhost:3000/alumnos/actualizar/${this.codigoOriginal}`, payload).subscribe({
      next: () => {
        this.alerts.success('El alumno fue actualizado correctamente ✅');

        const index = this.dataSource.data.findIndex(a => a.codigo === this.codigoOriginal);
        if (index !== -1) {
          this.dataSource.data[index] = { ...this.dataSource.data[index], ...payload };
          this.dataSource._updateChangeSubscription();
        }

        this.alumnoEditando = null;
        this.editandoAlumno.emit(false);
      },
      error: (err) => {
        console.error('Error completo del backend:', err);
        const mensaje = Array.isArray(err?.error?.message)
          ? err.error.message.join(', ')
          : err?.error?.message || err?.message || 'Error desconocido al actualizar';

        // Mensaje personalizado si el código está duplicado
        if (mensaje.includes('El código ya está registrado')) {
          this.alerts.error('Ese código ya pertenece a otro alumno. Intenta con uno diferente.');
        } else {
          this.alerts.error(mensaje);
        }
      }
    });
  }
}
