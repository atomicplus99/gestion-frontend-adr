import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

interface JustificacionResponseDto {
  id_justificacion: string;
  tipo_justificacion: string;
  motivo: string;
  estado: string;
  fecha_solicitud: Date;
  fechas_de_justificacion: string[];
  documentos_adjuntos?: string[];
  fecha_respuesta?: Date;
  observaciones_solicitante?: string;
  alumno_solicitante: {
    id_alumno: string;
    codigo: string;
    nombre: string;
    apellido: string;
    nivel: string;
    grado: number;
    seccion: string;
  };
  auxiliar_encargado: {
    id_auxiliar: string;
    nombre: string;
    apellido: string;
    correo_electronico: string;
  };
  asistencias_creadas?: number;
}

interface Alumno {
  id_alumno: string;
  codigo: string;
  nombre: string;
  apellido: string;
  nivel: string;
  grado: number;
  seccion: string;
}

interface JustificacionesResponse {
  statusCode: number;
  message: string;
  data: JustificacionResponseDto[];
  total: number;
}

@Component({
  selector: 'app-lista-justificaciones',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, HttpClientModule],
  templateUrl: './list-solicitudes-justificaciones-alumnos.component.html',
  styleUrls: ['./list-solicitudes-justificaciones-alumnos.component.css']
})
export class ListaJustificacionesComponent implements OnInit {
  justificaciones: JustificacionResponseDto[] = [];
  justificacionesFiltradas: JustificacionResponseDto[] = [];
  
  // Estados de carga
  isLoading = false;
  isSearchingAlumno = false;
  
  Math = Math;

  // Filtros
  filtroForm!: FormGroup;
  alumnoEncontrado: Alumno | null = null;
  errorBusquedaAlumno = '';
  
  // Paginación
  paginaActual = 1;
  itemsPorPagina = 10;
  totalPaginas = 0;
  
  // UI
  showAlert = false;
  alertType: 'success' | 'error' | 'info' = 'info';
  alertMessage = '';
  justificacionExpandida: string | null = null;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.initForm();
    this.cargarTodasJustificaciones();
  }

  initForm() {
    this.filtroForm = this.fb.group({
      codigo_alumno: [''],
      estado: [''],
      tipo_justificacion: [''],
      fecha_desde: [''],
      fecha_hasta: ['']
    });

    // Escuchar cambios en los filtros
    this.filtroForm.valueChanges.subscribe(() => {
      this.aplicarFiltros();
    });
  }

  async cargarTodasJustificaciones() {
    this.isLoading = true;
    this.alumnoEncontrado = null;
    this.errorBusquedaAlumno = '';
    
    try {

      
      const response = await this.http.get<JustificacionesResponse>(`${environment.apiUrl}/detalle-justificaciones`).toPromise();
      
      if (response) {
        this.justificaciones = response.data || [];
        this.aplicarFiltros();

        
        if (this.justificaciones.length === 0) {
          this.showAlertMessage('No se encontraron justificaciones', 'info');
        }
      }
    } catch (error) {
      console.error('Error cargando justificaciones:', error);
      this.showAlertMessage('Error al cargar las justificaciones', 'error');
      this.justificaciones = [];
      this.justificacionesFiltradas = [];
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  async buscarAlumno() {
    const codigo = this.filtroForm.get('codigo_alumno')?.value?.trim();
    if (!codigo) {
      this.cargarTodasJustificaciones();
      return;
    }

    this.isSearchingAlumno = true;
    this.errorBusquedaAlumno = '';
    this.alumnoEncontrado = null;

    try {
      
      
      const alumno = await this.http.get<Alumno>(`${environment.apiUrl}/alumnos/codigo/${codigo}`).toPromise();
      
      if (alumno) {
        this.alumnoEncontrado = alumno;
        
        
        // Cargar justificaciones del alumno
        await this.cargarJustificacionesPorAlumno(alumno.id_alumno);
      }
    } catch (error: any) {
      console.error('Error buscando alumno:', error);
      
      if (error.status === 404) {
        this.errorBusquedaAlumno = 'No se encontró un alumno con ese código';
      } else {
        this.errorBusquedaAlumno = 'Error al buscar el alumno. Intente nuevamente.';
      }
      
      this.justificaciones = [];
      this.justificacionesFiltradas = [];
    } finally {
      this.isSearchingAlumno = false;
      this.cdr.detectChanges();
    }
  }

  async cargarJustificacionesPorAlumno(id_alumno: string) {
    this.isLoading = true;
    
    try {
      
      
      const response = await this.http.get<JustificacionesResponse>(`${environment.apiUrl}/detalle-justificaciones/alumno/${id_alumno}`).toPromise();
      
      if (response) {
        this.justificaciones = response.data || [];
        this.aplicarFiltros();
        
        
        if (this.justificaciones.length === 0) {
          this.showAlertMessage('El alumno no tiene solicitudes de justificación', 'info');
        }
      }
    } catch (error) {
      console.error('Error cargando justificaciones del alumno:', error);
      this.showAlertMessage('Error al cargar las justificaciones del alumno', 'error');
      this.justificaciones = [];
      this.justificacionesFiltradas = [];
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  aplicarFiltros() {
    let filtradas = [...this.justificaciones];
    const filtros = this.filtroForm.value;

    // Filtro por estado
    if (filtros.estado) {
      filtradas = filtradas.filter(j => j.estado === filtros.estado);
    }

    // Filtro por tipo
    if (filtros.tipo_justificacion) {
      filtradas = filtradas.filter(j => j.tipo_justificacion === filtros.tipo_justificacion);
    }

    // Filtro por fecha desde
    if (filtros.fecha_desde) {
      const fechaDesde = new Date(filtros.fecha_desde);
      filtradas = filtradas.filter(j => {
        const fechaSolicitud = new Date(j.fecha_solicitud);
        return fechaSolicitud >= fechaDesde;
      });
    }

    // Filtro por fecha hasta
    if (filtros.fecha_hasta) {
      const fechaHasta = new Date(filtros.fecha_hasta);
      filtradas = filtradas.filter(j => {
        const fechaSolicitud = new Date(j.fecha_solicitud);
        return fechaSolicitud <= fechaHasta;
      });
    }

    this.justificacionesFiltradas = filtradas;
    this.calcularPaginacion();
    this.paginaActual = 1; // Resetear a primera página
    
    
  }

  calcularPaginacion() {
    this.totalPaginas = Math.ceil(this.justificacionesFiltradas.length / this.itemsPorPagina);
  }

  get justificacionesPaginadas(): JustificacionResponseDto[] {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    return this.justificacionesFiltradas.slice(inicio, fin);
  }

  cambiarPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
      this.cdr.detectChanges();
    }
  }

  get paginasArray(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }

  toggleDetalles(id_justificacion: string) {
    if (this.justificacionExpandida === id_justificacion) {
      this.justificacionExpandida = null;
    } else {
      this.justificacionExpandida = id_justificacion;
    }
  }

  limpiarFiltros() {
    this.filtroForm.reset();
    this.alumnoEncontrado = null;
    this.errorBusquedaAlumno = '';
    this.cargarTodasJustificaciones();
  }

  formatearFecha(fecha: Date | string): string {
    if (!fecha) return '-';
    const fechaObj = new Date(fecha);
    return fechaObj.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatearFechaCorta(fecha: Date | string): string {
    if (!fecha) return '-';
    const fechaObj = new Date(fecha);
    return fechaObj.toLocaleDateString('es-ES');
  }

  formatearFechasJustificacion(fechas: string[]): string {
    if (!fechas || fechas.length === 0) return '-';
    return fechas.join(', ');
  }

  getEstadoClase(estado: string): string {
    switch (estado) {
      case 'PENDIENTE':
        return 'bg-yellow-100 text-yellow-800';
      case 'APROBADA':
        return 'bg-green-100 text-green-800';
      case 'RECHAZADA':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getTipoClase(tipo: string): string {
    switch (tipo) {
      case 'MEDICA':
        return 'bg-blue-100 text-blue-800';
      case 'FAMILIAR':
        return 'bg-purple-100 text-purple-800';
      case 'ACADEMICA':
        return 'bg-indigo-100 text-indigo-800';
      case 'PERSONAL':
        return 'bg-pink-100 text-pink-800';
      case 'EMERGENCIA':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  showAlertMessage(message: string, type: 'success' | 'error' | 'info') {
    this.alertMessage = message;
    this.alertType = type;
    this.showAlert = true;
    this.cdr.detectChanges();
    
    setTimeout(() => {
      this.showAlert = false;
      this.cdr.detectChanges();
    }, 5000);
  }

  exportarCSV() {
    if (this.justificacionesFiltradas.length === 0) {
      this.showAlertMessage('No hay datos para exportar', 'info');
      return;
    }

    const headers = [
      'ID',
      'Código Alumno',
      'Nombre Alumno',
      'Tipo',
      'Estado',
      'Fecha Solicitud',
      'Fechas Justificación',
      'Motivo',
      'Fecha Respuesta',
      'Asistencias Creadas'
    ];

    const csvData = this.justificacionesFiltradas.map(j => [
      j.id_justificacion,
      j.alumno_solicitante.codigo,
      `${j.alumno_solicitante.nombre} ${j.alumno_solicitante.apellido}`,
      j.tipo_justificacion,
      j.estado,
      this.formatearFechaCorta(j.fecha_solicitud),
      this.formatearFechasJustificacion(j.fechas_de_justificacion),
      j.motivo.replace(/[",]/g, ' '),
      j.fecha_respuesta ? this.formatearFechaCorta(j.fecha_respuesta) : '-',
      j.asistencias_creadas || 0
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `justificaciones_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.showAlertMessage('Archivo CSV exportado exitosamente', 'success');
  }

  actualizarLista() {
    if (this.alumnoEncontrado) {
      this.cargarJustificacionesPorAlumno(this.alumnoEncontrado.id_alumno);
    } else {
      this.cargarTodasJustificaciones();
    }
  }
}