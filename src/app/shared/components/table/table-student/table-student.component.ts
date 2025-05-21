// table-student.component.ts

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
import { PersonalAlumno } from '../../../../gestion-academica-ar/pages/register/interfaces/alumno.interface';
import { AlertsService } from '../../../alerts.service';

@Component({
  selector: 'shared-table-student',
  templateUrl: './table-student.component.html',
  styleUrls: ['./table-student.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe
  ]
})
export class TableStudentComponent implements OnChanges, OnInit {
  @Input() codigoSeleccionado!: string;
  @Input() nivelFiltro: string = '';
  
  @Output() editandoAlumno = new EventEmitter<boolean>();
  @Output() alumnoActualizado = new EventEmitter<PersonalAlumno>();

  // Configuración de la tabla
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

  // Datos y estado
  dataSource: PersonalAlumno[] = [];
  filteredData: PersonalAlumno[] = [];
  paginatedData: PersonalAlumno[] = [];
  alumnoEditando: PersonalAlumno | null = null;
  alumnoDetalle: PersonalAlumno | null = null;
  secciones: string[] = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
  niveles: string[] = ['Inicial', 'Primaria', 'Secundaria'];
  loading = false;
  guardando = false;
  codigoOriginal!: string;
  mostrarTarjetas = false;
  ultimaActualizacion = new Date();
  
  // Paginación personalizada
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  startIndex = 0;
  endIndex = 0;
  
  // Ordenamiento
  sortColumn: string = 'codigo';
  sortDirection: 'asc' | 'desc' = 'asc';
  
  // Filtrado
  filterValue: string = '';

  constructor(
    private alumnoSvc: AlumnoService,
    private cd: ChangeDetectorRef,
    private http: HttpClient,
    private alerts: AlertsService
  ) {}

  ngOnInit(): void {
    // No hay ninguna inicialización necesaria aquí
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Manejar cambios en las entradas
    if (changes['codigoSeleccionado'] && this.codigoSeleccionado) {
      this.fetchAlumno(this.codigoSeleccionado);
    }

    if (changes['nivelFiltro']) {
      this.aplicarFiltroNivel();
    }
  }

  /**
   * Obtiene los datos del alumno desde el servicio
   */
  private fetchAlumno(codigo: string) {
    this.loading = true;
    this.cd.markForCheck();

    this.alumnoSvc.getByCodigo(codigo).subscribe({
      next: alumno => {
        this.dataSource = [alumno];
        this.filteredData = [...this.dataSource];
        
        // Actualizar paginación
        this.updatePagination();
        
        this.loading = false;
        
        // Simulamos una fecha de última actualización
        this.ultimaActualizacion = new Date();
        
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

  /**
   * Actualiza la paginación basada en los datos filtrados
   */
  private updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredData.length / this.pageSize);
    
    // Ajustar página actual si es necesario
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages || 1;
    }
    
    // Calcular índices
    this.startIndex = (this.currentPage - 1) * this.pageSize;
    this.endIndex = Math.min(this.startIndex + this.pageSize, this.filteredData.length);
    
    // Actualizar datos paginados
    this.paginatedData = this.filteredData.slice(this.startIndex, this.endIndex);
  }

  /**
   * Navega a una página específica
   */
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    
    this.currentPage = page;
    this.updatePage();
  }

  /**
   * Actualiza la página actual después de cambiar el tamaño de página
   */
  updatePage(): void {
    this.updatePagination();
    this.cd.markForCheck();
  }

  /**
   * Ordena la tabla por columna
   */
  sortTable(column: string): void {
    if (this.sortColumn === column) {
      // Invertir dirección si es la misma columna
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // Nueva columna, establecer a ascendente por defecto
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    
    // Ordenar datos
    this.filteredData.sort((a: any, b: any) => {
      const valueA = a[column];
      const valueB = b[column];
      
      // Manejar fechas especialmente
      if (column === 'fecha_nacimiento') {
        const dateA = new Date(valueA);
        const dateB = new Date(valueB);
        return this.sortDirection === 'asc' ? 
          dateA.getTime() - dateB.getTime() : 
          dateB.getTime() - dateA.getTime();
      }
      
      // Manejar números
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return this.sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
      }
      
      // Manejar strings
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return this.sortDirection === 'asc' ? 
          valueA.localeCompare(valueB) : 
          valueB.localeCompare(valueA);
      }
      
      return 0;
    });
    
    // Actualizar paginación
    this.updatePagination();
  }

  /**
   * Aplica un filtro de búsqueda a la tabla
   */
  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.filterValue = filterValue;
    
    if (!filterValue) {
      // Sin filtro, mostrar todos los datos
      this.filteredData = [...this.dataSource];
    } else {
      // Aplicar filtro
      this.filteredData = this.dataSource.filter((alumno: PersonalAlumno) => {
        return alumno.codigo.toLowerCase().includes(filterValue) ||
               alumno.nombre.toLowerCase().includes(filterValue) ||
               alumno.apellido.toLowerCase().includes(filterValue) ||
               alumno.dni_alumno.toLowerCase().includes(filterValue) ||
               alumno.nivel.toLowerCase().includes(filterValue);
      });
    }
    
    // Resetear a la primera página
    this.currentPage = 1;
    
    // Actualizar paginación
    this.updatePagination();
  }

  /**
   * Aplica el filtro por nivel académico
   */
  filtrarPorNivel(nivel: string): void {
    this.nivelFiltro = this.nivelFiltro === nivel ? '' : nivel;
    this.aplicarFiltroNivel();
  }

  /**
   * Aplica el filtro por nivel académico a los datos
   */
  private aplicarFiltroNivel(): void {
    // Restaurar datos originales sin filtro
    if (!this.nivelFiltro) {
      // Si teníamos un filtro y lo estamos quitando, recargar el alumno
      if (this.codigoSeleccionado) {
        this.fetchAlumno(this.codigoSeleccionado);
      }
      return;
    }

    // Aplicar filtro de nivel si hay uno seleccionado
    this.filteredData = this.dataSource.filter(alumno => 
      alumno.nivel.toLowerCase() === this.nivelFiltro.toLowerCase()
    );
    
    // Actualizar paginación
    this.updatePagination();
    
    this.cd.markForCheck();
  }

  /**
   * Cambia entre vista de tabla y tarjetas
   */
  cambiarVista(): void {
    this.mostrarTarjetas = !this.mostrarTarjetas;
    this.cd.markForCheck();
  }

  /**
   * Inicia la edición de un alumno
   */
  editarAlumno(alumno: PersonalAlumno): void {
    this.alumnoEditando = { ...alumno };
    this.codigoOriginal = alumno.codigo;
    this.editandoAlumno.emit(true);
    this.cd.markForCheck();
  }

  /**
   * Cancela la edición del alumno
   */
  cancelarEdicion(): void {
    this.alumnoEditando = null;
    this.editandoAlumno.emit(false);
    this.cd.markForCheck();
  }

  /**
   * Guarda los cambios del alumno editado
   */
  guardarEdicion(): void {
    if (!this.alumnoEditando) return;

    this.guardando = true;
    this.cd.markForCheck();

    // Prepara los datos para enviar al servidor
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

    // Realiza la petición al servidor
    this.http.put(`http://localhost:3000/alumnos/actualizar/${this.codigoOriginal}`, payload).subscribe({
      next: () => {
        this.alerts.success('El alumno fue actualizado correctamente ✅');

        // Actualiza los datos en la tabla
        const index = this.dataSource.findIndex(a => a.codigo === this.codigoOriginal);
        if (index !== -1) {
          this.dataSource[index] = { ...this.dataSource[index], ...payload };
          
          // Actualizar datos filtrados y paginados
          this.aplicarFiltroNivel();
          
          // Emitir evento de actualización para que el componente padre pueda actualizar sus datos
          this.alumnoActualizado.emit(this.dataSource[index]);
        }

        // Resetear estado
        this.alumnoEditando = null;
        this.editandoAlumno.emit(false);
        this.guardando = false;
        this.cd.markForCheck();
      },
      error: (err) => {
        console.error('Error completo del backend:', err);
        this.guardando = false;
        
        const mensaje = Array.isArray(err?.error?.message)
          ? err.error.message.join(', ')
          : err?.error?.message || err?.message || 'Error desconocido al actualizar';

        // Mensaje personalizado si el código está duplicado
        if (mensaje.includes('El código ya está registrado')) {
          this.alerts.error('Ese código ya pertenece a otro alumno. Intenta con uno diferente.');
        } else {
          this.alerts.error(mensaje);
        }
        
        this.cd.markForCheck();
      }
    });
  }

  /**
   * Muestra los detalles de un alumno
   */
  verDetalles(alumno: PersonalAlumno): void {
    this.alumnoDetalle = { ...alumno };
    this.cd.markForCheck();
  }

  /**
   * Cierra el modal de detalles
   */
  cerrarDetalles(): void {
    this.alumnoDetalle = null;
    this.cd.markForCheck();
  }

  /**
   * Edita desde la vista de detalles
   */
  editarDesdeDetalle(): void {
    if (this.alumnoDetalle) {
      this.editarAlumno(this.alumnoDetalle);
      this.alumnoDetalle = null;
    }
  }
}