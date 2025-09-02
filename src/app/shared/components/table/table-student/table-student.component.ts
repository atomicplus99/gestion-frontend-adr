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
import { 
  AlumnoUpdateShared, 
  TurnoShared 
} from '../../../interfaces/alumno-shared.interface';

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
  @Output() alumnoActualizado = new EventEmitter<AlumnoUpdateShared>();

  displayedColumns: string[] = ['codigo', 'dni_alumno', 'nombre', 'apellido', 'fecha_nacimiento', 'direccion', 'codigo_qr', 'nivel', 'grado', 'seccion', 'turno', 'acciones'];
  dataSource: AlumnoUpdateShared[] = [];
  filteredData: AlumnoUpdateShared[] = [];
  paginatedData: AlumnoUpdateShared[] = [];
  alumnoEditando: AlumnoUpdateShared | null = null;
  alumnoDetalle: AlumnoUpdateShared | null = null;
  secciones: string[] = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
  niveles: string[] = ['Inicial', 'Primaria', 'Secundaria'];
  loading = false;
  guardando = false;
  codigoOriginal!: string;
  mostrarTarjetas = false;
  ultimaActualizacion = new Date();
  turnosDisponibles: TurnoShared[] = [];
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
    if (changes['codigoSeleccionado'] && this.codigoSeleccionado && 
        changes['codigoSeleccionado'].currentValue !== changes['codigoSeleccionado'].previousValue) {
      console.log('📊 [TABLE-STUDENT] Código seleccionado cambió:', this.codigoSeleccionado);
      this.fetchAlumno(this.codigoSeleccionado);
    }
    if (changes['nivelFiltro']) {
      this.aplicarFiltroNivel();
    }
  }

  private cargarTurnos(): void {
    this.cargandoTurnos = true;
    this.cd.markForCheck();
    this.http.get<TurnoShared[]>(`${environment.apiUrl}/turno`).subscribe({
      next: (response) => {
        console.log('✅ [TABLE-STUDENT] Respuesta de turnos:', response);
        
        // Verificar si la respuesta es un array o un objeto con data
        if (Array.isArray(response)) {
          this.turnosDisponibles = response;
        } else if (response && (response as any).data && Array.isArray((response as any).data)) {
          this.turnosDisponibles = (response as any).data;
        } else {
          console.error('❌ [TABLE-STUDENT] Respuesta de turnos no es un array:', response);
          this.turnosDisponibles = [];
          this.alerts.error('Formato de respuesta de turnos inesperado');
        }
        
        this.cargandoTurnos = false;
        console.log('✅ [TABLE-STUDENT] Turnos cargados:', this.turnosDisponibles);
        this.cd.markForCheck();
      },
      error: (error) => {
        console.error('❌ [TABLE-STUDENT] Error al cargar turnos:', error);
        this.alerts.error('No se pudieron cargar los turnos disponibles');
        this.turnosDisponibles = [];
        this.cargandoTurnos = false;
        this.cd.markForCheck();
      }
    });
  }

  getTurnoById(id_turno: string): TurnoShared | null {
    return this.turnosDisponibles.find(turno => turno.id_turno === id_turno) || null;
  }

  formatearHorarioTurno(turno: TurnoShared): string {
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
    // Evitar llamadas duplicadas
    if (this.loading) {
      console.log('⚠️ [TABLE-STUDENT] Ya se está cargando un alumno, ignorando nueva petición');
      return;
    }
    
    console.log('🔍 [TABLE-STUDENT] Iniciando búsqueda de alumno:', codigo);
    this.loading = true;
    this.cd.markForCheck();
    this.alumnoSvc.getByCodigo(codigo).subscribe({
      next: response => {
        if (response && response.success && response.data) {
          this.dataSource = [response.data];
          this.filteredData = [...this.dataSource];
          this.updatePagination();
          this.loading = false;
          this.ultimaActualizacion = new Date();
          console.log('✅ [TABLE-STUDENT] Alumno cargado exitosamente:', response.data);
          this.cd.markForCheck();
        } else {
          console.error('❌ [TABLE-STUDENT] Respuesta inesperada del backend:', response);
          this.dataSource = [];
          this.filteredData = [];
          this.paginatedData = [];
          this.loading = false;
          this.alerts.error('Formato de respuesta inesperado del servidor');
          this.cd.markForCheck();
        }
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
      this.filteredData = this.dataSource.filter((alumno: AlumnoUpdateShared) => {
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

  editarAlumno(alumno: AlumnoUpdateShared): void {
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
    if (this.alumnoEditando.codigo.length < 1) return 'El código debe tener al menos 1 dígito';
    if (this.alumnoEditando.dni_alumno.length !== 8) return 'El DNI debe tener exactamente 8 dígitos';
    if (this.alumnoEditando.nombre.length > 100) return 'El nombre no puede superar los 100 caracteres';
    if (this.alumnoEditando.apellido.length > 100) return 'El apellido no puede superar los 100 caracteres';
    if (this.alumnoEditando.direccion.length > 100) return 'La dirección no puede superar los 100 caracteres';
    if (!['Inicial', 'Primaria', 'Secundaria'].includes(this.alumnoEditando.nivel)) return 'El nivel debe ser Inicial, Primaria o Secundaria';
    if (this.alumnoEditando.grado < 1 || this.alumnoEditando.grado > 12) return 'El grado debe estar entre 1 y 12';
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
      fecha_nacimiento: this.alumnoEditando.fecha_nacimiento, // Ya es string, no necesita conversión
      direccion: this.alumnoEditando.direccion,
      nivel: this.alumnoEditando.nivel,
      grado: this.alumnoEditando.grado,
      seccion: this.alumnoEditando.seccion
    };
    
    // ✅ RESTAURADOS: El backend SÍ acepta estos campos según la confirmación
    if (this.alumnoEditando.codigo_qr && this.alumnoEditando.codigo_qr.trim()) {
      payload.codigo_qr = this.alumnoEditando.codigo_qr.trim();
    }
    if (this.alumnoEditando.turno && this.alumnoEditando.turno.id_turno) {
      payload.id_turno = this.alumnoEditando.turno.id_turno;
    } else {
      payload.id_turno = null;
    }
    console.log('📤 [TABLE-STUDENT] Payload a enviar:', payload);
    console.log('🌐 [TABLE-STUDENT] URL:', `${environment.apiUrl}/alumnos/actualizar/${this.codigoOriginal}`);
    console.log('🔧 [TABLE-STUDENT] Código original:', this.codigoOriginal);
    
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
        console.error('❌ [TABLE-STUDENT] Error completo del backend:', err);
        this.guardando = false;
        
        let mensaje = 'Error desconocido al actualizar';
        
        if (err?.error) {
          console.log('📋 [TABLE-STUDENT] Error del backend:', err.error);
          
          // Manejar diferentes formatos de error del backend
          if (Array.isArray(err.error.message)) {
            // Si message es un array (errores de validación múltiples)
            mensaje = err.error.message.join('\n• ');
            mensaje = '• ' + mensaje; // Agregar bullet point al inicio
          } else if (err.error.message) {
            // Si message es un string
            mensaje = err.error.message;
          } else if (err.error.error) {
            // Si hay un campo error
            mensaje = err.error.error;
          }
        } else if (err?.message) {
          mensaje = err.message;
        }
        
        // Casos especiales
        if (mensaje.includes('El código ya está registrado') || mensaje.includes('codigo')) {
          this.alerts.error('❌ Ese código ya pertenece a otro alumno. Intenta con uno diferente.');
        } else if (err.status === 400) {
          this.alerts.error(`❌ Error de validación:\n\n${mensaje}`);
        } else if (err.status === 404) {
          this.alerts.error('❌ Alumno no encontrado');
        } else if (err.status >= 500) {
          this.alerts.error('❌ Error del servidor. Inténtalo más tarde.');
        } else {
          this.alerts.error(`❌ Error al actualizar alumno:\n\n${mensaje}`);
        }
        
        this.cd.markForCheck();
      }
    });
  }

  verDetalles(alumno: AlumnoUpdateShared): void {
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