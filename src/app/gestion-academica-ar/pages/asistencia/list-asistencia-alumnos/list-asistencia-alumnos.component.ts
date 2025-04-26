// src/app/gestion-academica-ar/pages/asistencias/list-asistencia-alumnos.component.ts

import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  AfterViewInit,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule }                         from '@angular/common';
import { HttpClientModule, HttpClient }         from '@angular/common/http';
import {
  MatTableModule,
  MatTableDataSource,
} from '@angular/material/table';
import { MatInputModule }                       from '@angular/material/input';
import { MatButtonModule }                      from '@angular/material/button';
import { MatPaginator, MatPaginatorModule }     from '@angular/material/paginator';
import { MatSort, MatSortModule }               from '@angular/material/sort';
import { FormsModule }                          from '@angular/forms';
import { environment }                          from '../../../../../environments/environment';

/* -------- Interfaz solo para la vista -------- */
export interface AsistenciaRow {
  codigo:      string;
  nombre:      string;
  apellido:    string;
  turno:       string | null;
  horaLlegada: string;
  estado:      'PUNTUAL' | 'TARDANZA';
  fecha:       string;           // ISO string
}

@Component({
  selector: 'app-list-asistencia-alumnos',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    MatTableModule,
    MatInputModule,
    MatButtonModule,
    MatPaginatorModule,
    MatSortModule,
    FormsModule,
  ],
  templateUrl: './list-asistencia-alumnos.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListAsistenciaAlumnosComponent
  implements OnInit, AfterViewInit
{
  private readonly http = inject(HttpClient);

  /* columnas que se pintan en la tabla */
  displayedColumns = [
    'codigo',
    'nombre',
    'apellido',
    'turno',
    'horaLlegada',
    'estado',
    'fecha',
  ];

  dataSource = new MatTableDataSource<AsistenciaRow>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort)      sort!:      MatSort;

  filterValue = '';

  ngOnInit(): void {
    this.http
      .get<any[]>(`${environment.apiUrl}/asistencia/list`)
      .subscribe({
        next: (raw) => {
          /* convierte la respuesta en filas para la tabla */
          this.dataSource.data = raw.map((r): AsistenciaRow => ({
            codigo:      r.alumno.codigo,
            nombre:      r.alumno.nombre,
            apellido:    r.alumno.apellido,
            turno:       r.alumno.turno?.turno ?? '—',
            horaLlegada: r.hora_de_llegada,
            estado:      r.estado_asistencia,
            fecha:       r.fecha,
          }));

          /* filtro global */
          this.dataSource.filterPredicate = (row, filter) =>
            [
              row.codigo,
              row.nombre,
              row.apellido,
              row.turno ?? '',
              row.estado,
            ]
              .join(' ')
              .toLowerCase()
              .includes(filter.trim().toLowerCase());
        },
        error: (err) =>
          console.error('Error al cargar asistencias', err),
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
}
