import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { JustificacionesService } from '../services/justificaciones.service';
import { 
  JustificacionItem, 
  JustificacionesQueryParams,
  FiltrosJustificaciones,
  EstadisticasJustificaciones,
  ESTADOS_JUSTIFICACION,
  TIPOS_JUSTIFICACION
} from '../interfaces/justificaciones.interface';

@Component({
  selector: 'app-list-justificaciones',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './list-justificaciones.component.html',
  styleUrls: ['./list-justificaciones.component.css']
})
export class ListJustificacionesComponent implements OnInit, OnDestroy {
  // ========================================
  // PROPIEDADES DEL COMPONENTE
  // ========================================
  
  justificaciones: JustificacionItem[] = [];
  estadisticas: EstadisticasJustificaciones | null = null;
  filtrosForm: FormGroup;
  
  // Estados de carga
  cargando = false;
  cargandoEstadisticas = false;
  
  // Paginación
  paginaActual = 1;
  elementosPorPagina = 10;
  totalElementos = 0;
  totalPaginas = 0;
  tieneSiguiente = false;
  tieneAnterior = false;
  
  // Opciones para filtros
  estadosOpciones = ESTADOS_JUSTIFICACION;
  tiposOpciones = TIPOS_JUSTIFICACION;
  
  // Propiedades para el detalle expandido
  justificacionExpandida: string | null = null;
  
  // Subject para manejo de suscripciones
  private destroy$ = new Subject<void>();
  
  constructor(
    private justificacionesService: JustificacionesService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.filtrosForm = this.crearFormularioFiltros();
  }

  ngOnInit(): void {
    this.cargarJustificaciones();
    this.cargarEstadisticas();
    this.configurarFiltrosEnTiempoReal();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========================================
  // MÉTODOS DE INICIALIZACIÓN
  // ========================================
  
  private crearFormularioFiltros(): FormGroup {
    return this.fb.group({
      codigo_alumno: [''],
      estado: [''],
      tipo_justificacion: [''],
      fecha_desde: [''],
      fecha_hasta: ['']
    });
  }

  private configurarFiltrosEnTiempoReal(): void {
    // Configurar búsqueda en tiempo real para código de alumno
    this.filtrosForm.get('codigo_alumno')?.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.aplicarFiltros();
      });

    // Configurar filtros inmediatos para otros campos
    this.filtrosForm.get('estado')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.aplicarFiltros();
      });

    this.filtrosForm.get('tipo_justificacion')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.aplicarFiltros();
      });

    this.filtrosForm.get('fecha_desde')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.aplicarFiltros();
      });

    this.filtrosForm.get('fecha_hasta')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.aplicarFiltros();
      });
  }

  // ========================================
  // MÉTODOS DE CARGA DE DATOS
  // ========================================
  
  cargarJustificaciones(): void {
    this.cargando = true;
    this.cdr.detectChanges();

    const filtros = this.obtenerFiltrosActuales();
    const queryParams: JustificacionesQueryParams = {
      ...filtros,
      pagina: this.paginaActual,
      elementos_por_pagina: this.elementosPorPagina
    };

    this.justificacionesService.obtenerJustificaciones(queryParams)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.justificaciones = response.data;
          this.totalElementos = response.total;
          this.totalPaginas = response.paginacion.total_paginas;
          this.tieneSiguiente = response.paginacion.tiene_siguiente;
          this.tieneAnterior = response.paginacion.tiene_anterior;
          this.cargando = false;
          this.cdr.detectChanges();
          
          console.log('✅ [LIST-JUSTIFICACIONES] Justificaciones cargadas:', response);
        },
        error: (error) => {
          console.error('❌ [LIST-JUSTIFICACIONES] Error al cargar justificaciones:', error);
          this.cargando = false;
          this.cdr.detectChanges();
        }
      });
  }

  cargarEstadisticas(): void {
    this.cargandoEstadisticas = true;
    this.cdr.detectChanges();

    this.justificacionesService.obtenerEstadisticas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (estadisticas) => {
          this.estadisticas = estadisticas;
          this.cargandoEstadisticas = false;
          this.cdr.detectChanges();
          
          console.log('✅ [LIST-JUSTIFICACIONES] Estadísticas cargadas:', estadisticas);
        },
        error: (error) => {
          console.error('❌ [LIST-JUSTIFICACIONES] Error al cargar estadísticas:', error);
          this.cargandoEstadisticas = false;
          this.cdr.detectChanges();
        }
      });
  }

  // ========================================
  // MÉTODOS DE FILTROS
  // ========================================
  
  aplicarFiltros(): void {
    this.paginaActual = 1; // Resetear a la primera página
    this.cargarJustificaciones();
  }

  limpiarFiltros(): void {
    this.filtrosForm.reset();
    this.paginaActual = 1;
    this.cargarJustificaciones();
  }

  private obtenerFiltrosActuales(): Partial<JustificacionesQueryParams> {
    const formValue = this.filtrosForm.value;
    const filtros: Partial<JustificacionesQueryParams> = {};

    // Solo agregar filtros que tengan valor
    if (formValue.codigo_alumno?.trim()) {
      filtros.codigo_alumno = formValue.codigo_alumno.trim();
    }
    if (formValue.estado) {
      filtros.estado = formValue.estado as "PENDIENTE" | "APROBADA" | "RECHAZADA" | "EN_REVISION";
    }
    if (formValue.tipo_justificacion) {
      filtros.tipo_justificacion = formValue.tipo_justificacion as "MEDICA" | "FAMILIAR" | "ACADEMICA" | "PERSONAL" | "EMERGENCIA";
    }
    if (formValue.fecha_desde) {
      filtros.fecha_desde = formValue.fecha_desde;
    }
    if (formValue.fecha_hasta) {
      filtros.fecha_hasta = formValue.fecha_hasta;
    }

    return filtros;
  }

  // ========================================
  // MÉTODOS DE PAGINACIÓN
  // ========================================
  
  irAPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
      this.cargarJustificaciones();
    }
  }

  paginaAnterior(): void {
    if (this.tieneAnterior) {
      this.irAPagina(this.paginaActual - 1);
    }
  }

  paginaSiguiente(): void {
    if (this.tieneSiguiente) {
      this.irAPagina(this.paginaActual + 1);
    }
  }

  cambiarElementosPorPagina(elementos: number): void {
    this.elementosPorPagina = elementos;
    this.paginaActual = 1;
    this.cargarJustificaciones();
  }

  onElementosPorPaginaChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const elementos = parseInt(target.value, 10) || 10;
    this.cambiarElementosPorPagina(elementos);
  }

  // ========================================
  // MÉTODOS DE UTILIDAD
  // ========================================
  
  formatearFecha(fechaISO: string): string {
    if (!fechaISO) return 'N/A';
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  obtenerClaseEstado(estado: string): string {
    switch (estado) {
      case 'PENDIENTE':
        return 'bg-yellow-100 text-yellow-800';
      case 'APROBADA':
        return 'bg-green-100 text-green-800';
      case 'RECHAZADA':
        return 'bg-red-100 text-red-800';
      case 'EN_REVISION':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  obtenerClaseTipo(tipo: string): string {
    switch (tipo) {
      case 'MEDICA':
        return 'bg-red-100 text-red-800';
      case 'FAMILIAR':
        return 'bg-blue-100 text-blue-800';
      case 'ACADEMICA':
        return 'bg-green-100 text-green-800';
      case 'PERSONAL':
        return 'bg-purple-100 text-purple-800';
      case 'EMERGENCIA':
        return 'bg-orange-100 text-orange-800';
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

  // ========================================
  // GETTERS PARA TEMPLATE
  // ========================================
  
  get tieneFiltrosActivos(): boolean {
    const filtros = this.filtrosForm.value;
    return !!(filtros.codigo_alumno || filtros.estado || filtros.tipo_justificacion || 
              filtros.fecha_desde || filtros.fecha_hasta);
  }

  get rangoElementos(): string {
    const inicio = (this.paginaActual - 1) * this.elementosPorPagina + 1;
    const fin = Math.min(this.paginaActual * this.elementosPorPagina, this.totalElementos);
    return `${inicio}-${fin} de ${this.totalElementos}`;
  }

  get paginasVisibles(): number[] {
    const paginas: number[] = [];
    const inicio = Math.max(1, this.paginaActual - 2);
    const fin = Math.min(this.totalPaginas, this.paginaActual + 2);
    
    for (let i = inicio; i <= fin; i++) {
      paginas.push(i);
    }
    
    return paginas;
  }

  // ========================================
  // MÉTODOS DE ACCIONES
  // ========================================
  
  verDetalle(justificacion: JustificacionItem): void {
    console.log('🔍 [LIST-JUSTIFICACIONES] Ver detalle de justificación:', justificacion);
    
    // Toggle de la expansión
    if (this.justificacionExpandida === justificacion.id_justificacion) {
      this.justificacionExpandida = null; // Cerrar si ya está abierto
    } else {
      this.justificacionExpandida = justificacion.id_justificacion; // Abrir
    }
  }
  
  estaExpandida(justificacion: JustificacionItem): boolean {
    return this.justificacionExpandida === justificacion.id_justificacion;
  }
  
  // Métodos helper para manejo seguro de datos del responsable
  obtenerNombreResponsable(justificacion: JustificacionItem): string {
    if (!justificacion.responsable) return 'Sin información';
    const nombre = justificacion.responsable.nombre || 'Sin nombre';
    const apellido = justificacion.responsable.apellido || '';
    return `${nombre} ${apellido}`.trim();
  }
  
  obtenerCorreoResponsable(justificacion: JustificacionItem): string {
    return justificacion.responsable?.correo_electronico || 'Sin email';
  }
  
  obtenerTipoResponsable(justificacion: JustificacionItem): string {
    return justificacion.responsable?.tipo || 'desconocido';
  }

  aprobarJustificacion(justificacion: JustificacionItem): void {
    console.log('✅ [LIST-JUSTIFICACIONES] Aprobar justificación:', justificacion);
    // TODO: Implementar lógica de aprobación
    if (confirm(`¿Estás seguro de aprobar la justificación de ${justificacion.alumno_solicitante.nombre} ${justificacion.alumno_solicitante.apellido}?`)) {
      alert('Justificación aprobada (funcionalidad pendiente)');
    }
  }

  rechazarJustificacion(justificacion: JustificacionItem): void {
    console.log('❌ [LIST-JUSTIFICACIONES] Rechazar justificación:', justificacion);
    // TODO: Implementar lógica de rechazo
    if (confirm(`¿Estás seguro de rechazar la justificación de ${justificacion.alumno_solicitante.nombre} ${justificacion.alumno_solicitante.apellido}?`)) {
      alert('Justificación rechazada (funcionalidad pendiente)');
    }
  }
}
