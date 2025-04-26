// src/app/gestion-academica-ar/pages/register/list-alumnos/listAlumnos.component.ts
import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule }                          from '@angular/common';
import { HttpClient, HttpClientModule }          from '@angular/common/http';
import {
  MatTableModule,
  MatTableDataSource,
} from '@angular/material/table';
import { MatInputModule }                        from '@angular/material/input';
import { MatButtonModule }                       from '@angular/material/button';
import { MatPaginator, MatPaginatorModule }      from '@angular/material/paginator';
import { MatSort, MatSortModule }                from '@angular/material/sort';
import { FormsModule }                           from '@angular/forms';
import { MatDialog, MatDialogModule }            from '@angular/material/dialog';
import { environment }                           from '../../../../../environments/environment';
import { DetalleAlumnoDialogComponent }          from '../../../../shared/components/dialog/dialog.component';

/* --------- Modelo sólo para la vista --------- */
export interface AlumnoEstado {
  codigo: string;
  dni_alumno: string;
  nombre: string;
  apellido: string;
  direccion: string;
  nivel: string;
  grado: number;
  seccion: string;
  turno:   { turno: string };
  usuario: { nombre_usuario: string; rol_usuario: string };
  estado_actual: {
    estado: string;
    observacion: string;
    fecha_actualizacion: string;
  };
  codigo_qr?: string;
  fecha_nacimiento?: string;
}

@Component({
  selector: 'app-lista-alumnos-estado',
  standalone: true,
  templateUrl: './listAlumnos.component.html',
  imports: [
    CommonModule,
    HttpClientModule,
    MatTableModule,
    MatInputModule,
    MatButtonModule,
    MatPaginatorModule,
    MatSortModule,
    FormsModule,
    MatDialogModule,
  ],
  styles: [`
    .rotate-180 { transform: rotate(180deg); }
    tr.mat-header-row.sticky { position: sticky; top: 0; z-index: 1; }
  `],
})
export class ListaAlumnosEstadoComponent implements OnInit, AfterViewInit {
  private readonly http   = inject(HttpClient);
  private readonly dialog = inject(MatDialog);

  /** Las 12 columnas solicitadas */
  displayedColumns = [
    'codigo', 'dni_alumno', 'nombre', 'apellido', 'nivel',
    'grado',  'seccion',    'turno',  'usuario', 'estado',
    'fecha_actualizacion', 'expand'
  ];
  dataSource = new MatTableDataSource<AlumnoEstado>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort)      sort!:      MatSort;

  filterValue = '';

  ngOnInit(): void {
    this.http
      .get<AlumnoEstado[]>(`${environment.apiUrl}/alumnos/estado`)
      .subscribe({
        next: (data) => {
          this.dataSource.data = data;

          /* filtro por varias columnas de texto */
          this.dataSource.filterPredicate = (row, filter) =>
            [
              row.codigo,
              row.dni_alumno,
              row.nombre,
              row.apellido,
              row.nivel,
              row.turno.turno,
              row.usuario.nombre_usuario,
              row.estado_actual.estado,
            ]
              .join(' ')
              .toLowerCase()
              .includes(filter.trim().toLowerCase());
        },
        error: (err) => {
          console.error('Error al cargar estados:', err);
          this.dataSource.data = [];
        },
      });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort      = this.sort;
  }

  applyFilter() {
    this.dataSource.filter = this.filterValue;
    if (this.paginator) this.paginator.firstPage();
  }

  /** Muestra un diálogo con los datos completos del alumno */
  openDetalle(row: AlumnoEstado) {
    this.dialog.open(DetalleAlumnoDialogComponent, {
      width: '480px',
      data: row,
      autoFocus: false,
    });
  }
}
