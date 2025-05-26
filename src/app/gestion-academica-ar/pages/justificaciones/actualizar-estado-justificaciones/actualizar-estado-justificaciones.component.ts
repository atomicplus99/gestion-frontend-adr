import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

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

interface BodyActualizarEstadoDto {
  nuevo_estado: 'APROBADA' | 'RECHAZADA';
  observaciones_respuesta?: string;
}

interface ActualizarEstadoResponse {
  statusCode: number;
  message: string;
  data: JustificacionResponseDto;
}

interface JustificacionesResponse {
  statusCode: number;
  message: string;
  data: JustificacionResponseDto[];
  total: number;
}

@Component({
  selector: 'app-gestion-estados-justificaciones',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, HttpClientModule],
  templateUrl: './actualizar-estado-justificaciones.component.html',
  styleUrls: ['./actualizar-estado-justificaciones.component.css']
})
export class GestionEstadosJustificacionesComponent implements OnInit {
  justificacionesPendientes: JustificacionResponseDto[] = [];
  Math = Math;
  // Estados de carga
  isLoading = false;
  isProcessing = false;
  
  // Modal de confirmación
  showModal = false;
  modalForm!: FormGroup;
  justificacionSeleccionada: JustificacionResponseDto | null = null;
  accionSeleccionada: 'APROBADA' | 'RECHAZADA' | null = null;
  
  // Paginación
  paginaActual = 1;
  itemsPorPagina = 10;
  totalPaginas = 0;
  
  // UI
  showAlert = false;
  alertType: 'success' | 'error' | 'info' = 'info';
  alertMessage = '';
  
  // Filtros
  filtroTipo = '';
  filtroFecha = '';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.initModalForm();
    this.cargarJustificacionesPendientes();
  }

  initModalForm() {
    this.modalForm = this.fb.group({
      observaciones_respuesta: ['', [Validators.maxLength(500)]]
    });
  }

  async cargarJustificacionesPendientes() {
    this.isLoading = true;
    
    try {
      console.log('Cargando justificaciones pendientes...');
      
      const response = await this.http.get<JustificacionesResponse>('http://localhost:3000/detalle-justificaciones').toPromise();
      
      if (response) {
        // Filtrar solo las que están PENDIENTES
        this.justificacionesPendientes = (response.data || []).filter(j => j.estado === 'PENDIENTE');
        this.aplicarFiltros();
        
        console.log(`Cargadas ${this.justificacionesPendientes.length} justificaciones pendientes`);
        
        if (this.justificacionesPendientes.length === 0) {
          this.showAlertMessage('No hay justificaciones pendientes de revisión', 'info');
        }
      }
    } catch (error) {
      console.error('Error cargando justificaciones:', error);
      this.showAlertMessage('Error al cargar las justificaciones pendientes', 'error');
      this.justificacionesPendientes = [];
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  get justificacionesFiltradas(): JustificacionResponseDto[] {
    let filtradas = [...this.justificacionesPendientes];
    
    // Filtro por tipo
    if (this.filtroTipo) {
      filtradas = filtradas.filter(j => j.tipo_justificacion === this.filtroTipo);
    }
    
    // Filtro por fecha
    if (this.filtroFecha) {
      const fechaFiltro = new Date(this.filtroFecha);
      filtradas = filtradas.filter(j => {
        const fechaSolicitud = new Date(j.fecha_solicitud);
        return fechaSolicitud.toDateString() === fechaFiltro.toDateString();
      });
    }
    
    return filtradas;
  }

  aplicarFiltros() {
    this.calcularPaginacion();
    this.paginaActual = 1;
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

  // Abrir modal de confirmación
  abrirModalConfirmacion(justificacion: JustificacionResponseDto, accion: 'APROBADA' | 'RECHAZADA') {
    this.justificacionSeleccionada = justificacion;
    this.accionSeleccionada = accion;
    this.modalForm.reset();
    this.showModal = true;
    this.cdr.detectChanges();
  }

  // Cerrar modal
  cerrarModal() {
    this.showModal = false;
    this.justificacionSeleccionada = null;
    this.accionSeleccionada = null;
    this.modalForm.reset();
    this.cdr.detectChanges();
  }

  // Confirmar cambio de estado
  async confirmarCambioEstado() {
    if (!this.justificacionSeleccionada || !this.accionSeleccionada) return;

    this.isProcessing = true;
    
    const payload: BodyActualizarEstadoDto = {
      nuevo_estado: this.accionSeleccionada,
      observaciones_respuesta: this.modalForm.get('observaciones_respuesta')?.value || undefined
    };

    try {
      console.log(`Actualizando justificación ${this.justificacionSeleccionada.id_justificacion} a ${this.accionSeleccionada}`);
      console.log('Payload:', payload);

      const response = await this.http.put<ActualizarEstadoResponse>(
        `http://localhost:3000/detalle-justificaciones/${this.justificacionSeleccionada.id_justificacion}/estado`,
        payload
      ).toPromise();

      if (response) {
        console.log('Response:', response);
        
        // Mostrar mensaje de éxito
        this.showAlertMessage(response.message || 'Estado actualizado exitosamente', 'success');
        
        // Recargar la lista
        await this.cargarJustificacionesPendientes();
        
        // Cerrar modal
        this.cerrarModal();
      }
    } catch (error: any) {
      console.error('Error actualizando estado:', error);
      
      let mensajeError = 'Error al actualizar el estado de la justificación';
      
      if (error.error) {
        if (typeof error.error === 'string') {
          mensajeError = error.error;
        } else if (error.error.message) {
          mensajeError = error.error.message;
        }
      }
      
      this.showAlertMessage(mensajeError, 'error');
    } finally {
      this.isProcessing = false;
      this.cdr.detectChanges();
    }
  }

  // Acción rápida sin observaciones
  async accionRapida(justificacion: JustificacionResponseDto, accion: 'APROBADA' | 'RECHAZADA') {
    this.isProcessing = true;
    
    const payload: BodyActualizarEstadoDto = {
      nuevo_estado: accion
    };

    try {
      console.log(`Acción rápida: ${accion} para justificación ${justificacion.id_justificacion}`);

      const response = await this.http.put<ActualizarEstadoResponse>(
        `http://localhost:3000/detalle-justificaciones/${justificacion.id_justificacion}/estado`,
        payload
      ).toPromise();

      if (response) {
        this.showAlertMessage(response.message || 'Estado actualizado exitosamente', 'success');
        await this.cargarJustificacionesPendientes();
      }
    } catch (error: any) {
      console.error('Error en acción rápida:', error);
      
      let mensajeError = 'Error al actualizar el estado';
      if (error.error?.message) {
        mensajeError = error.error.message;
      }
      
      this.showAlertMessage(mensajeError, 'error');
    } finally {
      this.isProcessing = false;
      this.cdr.detectChanges();
    }
  }

  limpiarFiltros() {
    this.filtroTipo = '';
    this.filtroFecha = '';
    this.aplicarFiltros();
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

  actualizarLista() {
    this.cargarJustificacionesPendientes();
  }

  // Métodos para estadísticas rápidas
  get totalPendientes(): number {
    return this.justificacionesPendientes.length;
  }

  get pendientesPorTipo(): { [key: string]: number } {
    return this.justificacionesPendientes.reduce((acc, j) => {
      acc[j.tipo_justificacion] = (acc[j.tipo_justificacion] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
  }

  get tiposDisponibles(): string[] {
    return [...new Set(this.justificacionesPendientes.map(j => j.tipo_justificacion))];
  }
}