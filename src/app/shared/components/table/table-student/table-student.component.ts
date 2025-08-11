import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlumnoService } from '../../../../gestion-academica-ar/services/alumno.service';
import { AlertsService } from '../../../alerts.service';
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

@Component({
  selector: 'shared-table-student',
  templateUrl: './table-student.component.html',
  styleUrls: ['./table-student.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe]
})
export class TableStudentComponent implements OnChanges, OnInit {
  @Input() codigoSeleccionado!: string;
  @Input() nivelFiltro: string = '';
  @Output() editandoAlumno = new EventEmitter<boolean>();
  @Output() alumnoActualizado = new EventEmitter<AlumnoUpdate>();

  displayedColumns: string[] = ['codigo', 'dni_alumno', 'nombre', 'apellido', 'fecha_nacimiento', 'direccion', 'codigo_qr', 'nivel', 'grado', 'seccion', 'turno', 'acciones'];
  dataSource: AlumnoUpdate[] = [];
  filteredData: AlumnoUpdate[] = [];
  paginatedData: AlumnoUpdate[] = [];
  alumnoEditando: AlumnoUpdate | null = null;
  alumnoDetalle: AlumnoUpdate | null = null;
  secciones: string[] = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
  niveles: string[] = ['Inicial', 'Primaria', 'Secundaria'];
  loading = false;
  guardando = false;
  codigoOriginal!: string;
  mostrarTarjetas = false;
  ultimaActualizacion = new Date();
  turnosDisponibles: Turno[] = [];
  cargandoTurnos = false;
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  startIndex = 0;
  endIndex = 0;
  sortColumn: string = 'codigo';
  sortDirection: 'asc' | 'desc' = 'asc';
  filterValue: string = '';

  constructor(private alumnoSvc: AlumnoService, private cd: ChangeDetectorRef, private http: HttpClient, private alerts: AlertsService) { }

  ngOnInit(): void {
    this.cargarTurnos();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['codigoSeleccionado'] && this.codigoSeleccionado) {
      this.fetchAlumno(this.codigoSeleccionado);
    }
    if (changes['nivelFiltro']) {
      this.aplicarFiltroNivel();
    }
  }

  private cargarTurnos(): void {
    this.cargandoTurnos = true;
    this.cd.markForCheck();
    this.http.get<Turno[]>(`${environment.apiUrl}/turno`).subscribe({
      next: (turnos) => {
        this.turnosDisponibles = turnos;
        this.cargandoTurnos = false;
        this.cd.markForCheck();
      },
      error: (error) => {
        console.error('Error al cargar turnos:', error);
        this.alerts.error('No se pudieron cargar los turnos disponibles');
        this.cargandoTurnos = false;
        this.cd.markForCheck();
      }
    });
  }

  getTurnoById(id_turno: string): Turno | null {
    return this.turnosDisponibles.find(turno => turno.id_turno === id_turno) || null;
  }

  formatearHorarioTurno(turno: Turno): string {
    if (!turno) return '';
    return `${turno.turno} (${turno.hora_inicio} - ${turno.hora_fin})`;
  }

  onTurnoChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const nuevoTurnoId = select.value;

    if (this.alumnoEditando) {
      if (nuevoTurnoId) {
        this.alumnoEditando.turno = this.getTurnoById(nuevoTurnoId) || undefined;
      } else {
        this.alumnoEditando.turno = undefined;
      }
    }
  }

  private fetchAlumno(codigo: string) {
    this.loading = true;
    this.cd.markForCheck();
    this.alumnoSvc.getByCodigo(codigo).subscribe({
      next: alumno => {
        this.dataSource = [alumno];
        this.filteredData = [...this.dataSource];
        this.updatePagination();
        this.loading = false;
        this.ultimaActualizacion = new Date();
        console.log('Alumno cargado:', alumno);
        this.cd.markForCheck();
      },
      error: (error) => {
        console.error('Error al obtener alumno:', error);
        this.dataSource = [];
        this.filteredData = [];
        this.paginatedData = [];
        this.loading = false;
        this.alerts.error(`No se pudo encontrar el alumno con código ${codigo}`);
        this.cd.markForCheck();
      }
    });
  }

  private updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredData.length / this.pageSize);
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages || 1;
    }
    this.startIndex = (this.currentPage - 1) * this.pageSize;
    this.endIndex = Math.min(this.startIndex + this.pageSize, this.filteredData.length);
    this.paginatedData = this.filteredData.slice(this.startIndex, this.endIndex);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePage();
  }

  updatePage(): void {
    this.updatePagination();
    this.cd.markForCheck();
  }

  sortTable(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.filteredData.sort((a: any, b: any) => {
      const valueA = a[column];
      const valueB = b[column];
      if (column === 'fecha_nacimiento') {
        const dateA = new Date(valueA);
        const dateB = new Date(valueB);
        return this.sortDirection === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
      }
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return this.sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
      }
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return this.sortDirection === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
      }
      return 0;
    });
    this.updatePagination();
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.filterValue = filterValue;
    if (!filterValue) {
      this.filteredData = [...this.dataSource];
    } else {
      this.filteredData = this.dataSource.filter((alumno: AlumnoUpdate) => {
        return alumno.codigo.toLowerCase().includes(filterValue) ||
          alumno.nombre.toLowerCase().includes(filterValue) ||
          alumno.apellido.toLowerCase().includes(filterValue) ||
          alumno.dni_alumno.toLowerCase().includes(filterValue) ||
          alumno.nivel.toLowerCase().includes(filterValue) ||
          (alumno.codigo_qr && alumno.codigo_qr.toLowerCase().includes(filterValue)) ||
          (alumno.turno && alumno.turno.turno.toLowerCase().includes(filterValue));
      });
    }
    this.currentPage = 1;
    this.updatePagination();
  }

  filtrarPorNivel(nivel: string): void {
    this.nivelFiltro = this.nivelFiltro === nivel ? '' : nivel;
    this.aplicarFiltroNivel();
  }

  private aplicarFiltroNivel(): void {
    if (!this.nivelFiltro) {
      if (this.codigoSeleccionado) {
        this.fetchAlumno(this.codigoSeleccionado);
      }
      return;
    }
    this.filteredData = this.dataSource.filter(alumno => alumno.nivel.toLowerCase() === this.nivelFiltro.toLowerCase());
    this.updatePagination();
    this.cd.markForCheck();
  }

  cambiarVista(): void {
    this.mostrarTarjetas = !this.mostrarTarjetas;
    this.cd.markForCheck();
  }

  editarAlumno(alumno: AlumnoUpdate): void {
    this.alumnoEditando = { ...alumno };
    this.codigoOriginal = alumno.codigo;
    this.editandoAlumno.emit(true);
    this.cd.markForCheck();
  }

  cancelarEdicion(): void {
    this.alumnoEditando = null;
    this.editandoAlumno.emit(false);
    this.cd.markForCheck();
  }

  private validarFormulario(): string | null {
    if (!this.alumnoEditando) return 'No hay datos para validar';
    if (this.alumnoEditando.codigo.length !== 14) return 'El código debe tener exactamente 14 dígitos';
    if (this.alumnoEditando.dni_alumno.length !== 8) return 'El DNI debe tener exactamente 8 dígitos';
    if (this.alumnoEditando.nombre.length > 100) return 'El nombre no puede superar los 100 caracteres';
    if (this.alumnoEditando.apellido.length > 100) return 'El apellido no puede superar los 100 caracteres';
    if (this.alumnoEditando.direccion.length > 100) return 'La dirección no puede superar los 100 caracteres';
    if (!['Inicial', 'Primaria', 'Secundaria'].includes(this.alumnoEditando.nivel)) return 'El nivel debe ser Inicial, Primaria o Secundaria';
    if (this.alumnoEditando.grado < 1 || this.alumnoEditando.grado > 6) return 'El grado debe estar entre 1 y 6';
    if (this.alumnoEditando.seccion.length !== 1) return 'La sección debe ser un solo carácter';
    if (this.alumnoEditando.codigo_qr && this.alumnoEditando.codigo_qr.length > 100) return 'El código QR no puede superar los 100 caracteres';
    if (this.alumnoEditando.turno) {
      const turnoExiste = this.turnosDisponibles.find(turno => turno.id_turno === this.alumnoEditando!.turno!.id_turno);
      if (!turnoExiste) return 'El turno seleccionado no es válido';
    }
    return null;
  }

  guardarEdicion(): void {
    if (!this.alumnoEditando) return;
    const error = this.validarFormulario();
    if (error) {
      this.alerts.error(error);
      return;
    }
    this.guardando = true;
    this.cd.markForCheck();
    const payload: any = {
      codigo: this.alumnoEditando.codigo,
      dni_alumno: this.alumnoEditando.dni_alumno,
      nombre: this.alumnoEditando.nombre,
      apellido: this.alumnoEditando.apellido,
      fecha_nacimiento: new Date(this.alumnoEditando.fecha_nacimiento).toISOString().split('T')[0],
      direccion: this.alumnoEditando.direccion,
      nivel: this.alumnoEditando.nivel,
      grado: this.alumnoEditando.grado,
      seccion: this.alumnoEditando.seccion
    };
    if (this.alumnoEditando.codigo_qr && this.alumnoEditando.codigo_qr.trim()) {
      payload.codigo_qr = this.alumnoEditando.codigo_qr.trim();
    }
    if (this.alumnoEditando.turno && this.alumnoEditando.turno.id_turno) {
      payload.id_turno = this.alumnoEditando.turno.id_turno;
    } else {
      payload.id_turno = null;
    }
    console.log('Payload a enviar:', payload);
    this.http.put(`${environment.apiUrl}/alumnos/actualizar/${this.codigoOriginal}`, payload).subscribe({
      next: (response: any) => {
        this.alerts.success('El alumno fue actualizado correctamente ✅');
        this.fetchAlumno(this.alumnoEditando!.codigo);
        if (response.alumno) {
          this.alumnoActualizado.emit(response.alumno);
        }
        this.alumnoEditando = null;
        this.editandoAlumno.emit(false);
        this.guardando = false;
        this.cd.markForCheck();
      },
      error: (err) => {
        console.error('Error completo del backend:', err);
        this.guardando = false;
        const mensaje = Array.isArray(err?.error?.message) ? err.error.message.join(', ') : err?.error?.message || err?.message || 'Error desconocido al actualizar';
        if (mensaje.includes('El código ya está registrado')) {
          this.alerts.error('Ese código ya pertenece a otro alumno. Intenta con uno diferente.');
        } else {
          this.alerts.error(mensaje);
        }
        this.cd.markForCheck();
      }
    });
  }

  verDetalles(alumno: AlumnoUpdate): void {
    this.alumnoDetalle = { ...alumno };
    this.cd.markForCheck();
  }

  cerrarDetalles(): void {
    this.alumnoDetalle = null;
    this.cd.markForCheck();
  }

  editarDesdeDetalle(): void {
    if (this.alumnoDetalle) {
      this.editarAlumno(this.alumnoDetalle);
      this.alumnoDetalle = null;
    }
  }

  onlyNumbers(event: any, field: string): void {
    const input = event.target;
    let value = input.value.replace(/[^0-9]/g, '');
    if (field === 'codigo' && value.length > 14) {
      value = value.slice(0, 14);
    } else if (field === 'dni' && value.length > 8) {
      value = value.slice(0, 8);
    }
    input.value = value;
    if (this.alumnoEditando) {
      if (field === 'codigo') {
        this.alumnoEditando.codigo = value;
      } else if (field === 'dni') {
        this.alumnoEditando.dni_alumno = value;
      }
    }
  }

  generarCodigoQR(): void {
    if (this.alumnoEditando) {
      this.alumnoEditando.codigo_qr = this.generateUUID();
    }
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}