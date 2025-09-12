import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { AlertsService } from '../../../../shared/alerts.service';

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
  responsable?: {
    tipo?: string;
    id?: string;
    nombre?: string;
    apellido?: string;
    correo_electronico?: string;
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
  success: boolean;
  message: string;
  timestamp: string;
  data: {
    statusCode: number;
    message: string;
    data: JustificacionResponseDto[];
    total: number;
    paginacion?: {
      pagina_actual: number;
      elementos_por_pagina: number;
      total_elementos: number;
      total_paginas: number;
      tiene_pagina_anterior: boolean;
      tiene_pagina_siguiente: boolean;
    };
  };
}

interface AlumnoResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: Alumno;
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
  justificacionExpandida: string | null = null;
  

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private alertsService: AlertsService
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
    
    // Asegurar que siempre sean arrays
    this.justificaciones = [];
    this.justificacionesFiltradas = [];
    
    try {
      const response = await this.http.get<JustificacionesResponse>(`${environment.apiUrl}/detalle-justificaciones`).toPromise();
      



      
      if (response && response.success && response.data && Array.isArray(response.data.data)) {
        this.justificaciones = response.data.data;
        this.aplicarFiltros();

        if (this.justificaciones.length === 0) {
          this.alertsService.info('No se encontraron solicitudes de justificación en el sistema', 'Sin Resultados');
        }
      } else {
        this.alertsService.error(response?.message || 'Respuesta del backend no válida o formato incorrecto', 'Error de Respuesta');
        // Asegurar que sean arrays vacíos
        this.justificaciones = [];
        this.justificacionesFiltradas = [];
      }
    } catch (error: any) {
      this.alertsService.error('Error al cargar las justificaciones', 'Error de Carga');
      
      let errorMessage = 'Error al cargar las justificaciones';
      if (error.status === 404) {
        errorMessage = 'Endpoint de justificaciones no encontrado';
      } else if (error.status === 500) {
        errorMessage = 'Error interno del servidor';
      } else if (error.status === 0) {
        errorMessage = 'No se pudo conectar con el servidor';
      }
      
      this.alertsService.error(errorMessage, 'Error de Conexión');
      
      // Asegurar que sean arrays vacíos
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
      const response = await this.http.get<AlumnoResponse>(`${environment.apiUrl}/alumnos/codigo/${codigo}`).toPromise();
      
      if (response && response.success) {
        this.alumnoEncontrado = response.data;
        
        // Cargar justificaciones del alumno
        await this.cargarJustificacionesPorAlumno(response.data.id_alumno);
      } else {
        this.errorBusquedaAlumno = response?.message || 'Respuesta del backend no válida';
        // Asegurar que sean arrays vacíos
        this.justificaciones = [];
        this.justificacionesFiltradas = [];
      }
    } catch (error: any) {
      this.alertsService.error('Error al buscar el alumno', 'Error de Búsqueda');
      
      if (error.status === 404) {
        this.errorBusquedaAlumno = 'No se encontró un alumno con ese código';
      } else if (error.status === 500) {
        this.errorBusquedaAlumno = 'Error interno del servidor';
      } else if (error.status === 0) {
        this.errorBusquedaAlumno = 'No se pudo conectar con el servidor';
      } else {
        this.errorBusquedaAlumno = 'Error al buscar el alumno. Intente nuevamente.';
      }
      
      // Asegurar que sean arrays vacíos
      this.justificaciones = [];
      this.justificacionesFiltradas = [];
    } finally {
      this.isSearchingAlumno = false;
      this.cdr.detectChanges();
    }
  }

  async cargarJustificacionesPorAlumno(id_alumno: string) {
    this.isLoading = true;
    
    // Asegurar que siempre sean arrays
    this.justificaciones = [];
    this.justificacionesFiltradas = [];
    
    try {
      const response = await this.http.get<JustificacionesResponse>(`${environment.apiUrl}/detalle-justificaciones/alumno/${id_alumno}`).toPromise();
      
      if (response && response.success && response.data && Array.isArray(response.data.data)) {
        this.justificaciones = response.data.data;
        this.aplicarFiltros();
        
        if (this.justificaciones.length === 0) {
          this.alertsService.info('El alumno no tiene solicitudes de justificación registradas', 'Sin Solicitudes');
        }
      } else {
        this.alertsService.error(response?.message || 'Respuesta del backend no válida o formato incorrecto', 'Error de Respuesta');
        // Asegurar que sean arrays vacíos
        this.justificaciones = [];
        this.justificacionesFiltradas = [];
      }
    } catch (error: any) {
      this.alertsService.error('Error al cargar las justificaciones del alumno', 'Error de Carga');
      
      let errorMessage = 'Error al cargar las justificaciones del alumno';
      if (error.status === 404) {
        errorMessage = 'No se encontraron justificaciones para este alumno';
      } else if (error.status === 500) {
        errorMessage = 'Error interno del servidor';
      } else if (error.status === 0) {
        errorMessage = 'No se pudo conectar con el servidor';
      }
      
      this.alertsService.error(errorMessage, 'Error de Conexión');
      
      // Asegurar que sean arrays vacíos
      this.justificaciones = [];
      this.justificacionesFiltradas = [];
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  aplicarFiltros() {
    // Verificar que this.justificaciones sea un array antes de procesar
    if (!Array.isArray(this.justificaciones)) {
      console.warn('this.justificaciones no es un array, inicializando como array vacío');
      this.justificaciones = [];
    }
    
    // Si no hay justificaciones, inicializar arrays vacíos
    if (this.justificaciones.length === 0) {
      this.justificacionesFiltradas = [];
      this.totalPaginas = 0;
      this.paginaActual = 1;
      return;
    }
    
    let filtradas = [...this.justificaciones];
    const filtros = this.filtroForm.value;

    // Filtro por estado
    if (filtros.estado && filtros.estado.trim() !== '') {
      filtradas = filtradas.filter(j => j.estado === filtros.estado);
    }

    // Filtro por tipo
    if (filtros.tipo_justificacion && filtros.tipo_justificacion.trim() !== '') {
      filtradas = filtradas.filter(j => j.tipo_justificacion === filtros.tipo_justificacion);
    }

    // Filtro por fecha desde
    if (filtros.fecha_desde && filtros.fecha_desde.trim() !== '') {
      try {
        const fechaDesde = new Date(filtros.fecha_desde);
        if (!isNaN(fechaDesde.getTime())) {
          filtradas = filtradas.filter(j => {
            try {
              const fechaSolicitud = new Date(j.fecha_solicitud);
              return !isNaN(fechaSolicitud.getTime()) && fechaSolicitud >= fechaDesde;
            } catch (e) {
              console.warn('Error procesando fecha de solicitud:', j.fecha_solicitud);
              return false;
            }
          });
        }
      } catch (e) {
        console.warn('Error procesando fecha desde:', filtros.fecha_desde);
      }
    }

    // Filtro por fecha hasta
    if (filtros.fecha_hasta && filtros.fecha_hasta.trim() !== '') {
      try {
        const fechaHasta = new Date(filtros.fecha_hasta);
        if (!isNaN(fechaHasta.getTime())) {
          filtradas = filtradas.filter(j => {
            try {
              const fechaSolicitud = new Date(j.fecha_solicitud);
              return !isNaN(fechaSolicitud.getTime()) && fechaSolicitud <= fechaHasta;
            } catch (e) {
              console.warn('Error procesando fecha de solicitud:', j.fecha_solicitud);
              return false;
            }
          });
        }
      } catch (e) {
        console.warn('Error procesando fecha hasta:', filtros.fecha_hasta);
      }
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

  obtenerClaseTipoResponsable(tipo: string | undefined): string {
    if (!tipo) {
      return 'bg-gray-100 text-gray-800';
    }
    
    switch (tipo) {
      case 'auxiliar':
        return 'bg-blue-100 text-blue-800';
      case 'administrador':
        return 'bg-green-100 text-green-800';
      case 'director':
        return 'bg-purple-100 text-purple-800';
      case 'desconocido':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  actualizarLista() {
    if (this.alumnoEncontrado) {
      this.cargarJustificacionesPorAlumno(this.alumnoEncontrado.id_alumno);
    } else {
      this.cargarTodasJustificaciones();
    }
  }

  exportarCSV() {
    if (this.justificacionesFiltradas.length === 0) {
      this.alertsService.info('No hay datos para exportar. Aplica filtros diferentes o verifica que existan justificaciones', 'Sin Datos');
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

    this.alertsService.success('Archivo CSV exportado correctamente', 'Exportación Exitosa');
  }

}