import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Asistencia, AsistenciaConAlumno, AsistenciaService } from '../services/ListAsistencia.service';
import { AlertsService } from '../../../../../shared/alerts.service';

@Component({
  selector: 'app-lista-asistencia',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  providers: [AsistenciaService],
  templateUrl: './list-asistencia-alumnos.component.html'
})
export class ListaAsistenciaComponent implements OnInit {
  asistencias: Asistencia[] = [];
  asistenciasFiltradas: Asistencia[] = [];
  loading = false;
  error: string | null = null;
  Math = Math;
  // Filtros
  filtros = {
    busquedaGeneral: '',
    estadoAsistencia: '',
    turno: '',
    fechaDesde: '',
    fechaHasta: '',
    nivel: '',
    grado: '',
    seccion: ''
  };

  // Datos únicos para filtros
  turnosUnicos: string[] = [];
  nivelesUnicos: string[] = [];
  gradosUnicos: number[] = [];
  seccionesUnicas: string[] = [];

  // Paginación
  paginaActual = 1;
  itemsPorPagina = 25;

  // Ordenamiento
  ordenActual = { campo: 'fecha', direccion: 'desc' as 'asc' | 'desc' };

  // Columnas de la tabla
  columnas = [
    { campo: 'alumno.codigo', label: 'Código' },
    { campo: 'alumno.nombre', label: 'Alumno' },
    { campo: 'alumno.nivel', label: 'Nivel/Grado' },
    { campo: 'alumno.turno', label: 'Turno' },
    { campo: 'fecha', label: 'Fecha' },
    { campo: 'hora_de_llegada', label: 'Hora Llegada' },
    { campo: 'hora_salida', label: 'Hora Salida' },
    { campo: 'estado_asistencia', label: 'Estado' }
  ];

  // Modal de detalle
  mostrarModalDetalle = false;
  alumnoDetalle: AsistenciaConAlumno | null = null;

  constructor(private asistenciaService: AsistenciaService, private cdr: ChangeDetectorRef, private alertsService: AlertsService) { }

  // Helper para obtener el turno de forma segura (puede ser string o objeto Turno)
  getTurnoDisplay(turno: any): string {
    if (!turno) return 'Sin turno';
    if (typeof turno === 'string') return turno;
    if (typeof turno === 'object' && turno.turno) return turno.turno;
    if (typeof turno === 'object' && turno.nombre) return turno.nombre; // Posible propiedad alternativa
    if (typeof turno === 'object' && turno.descripcion) return turno.descripcion; // Posible propiedad alternativa
    
    return 'Sin turno';
  }

  // Helper para obtener el turno desde las asistencias del alumno (para el modal de detalles)
  getTurnoDesdeAsistencias(alumnoDetalle: AsistenciaConAlumno | null): any {
    if (!alumnoDetalle || !alumnoDetalle.asistencias || alumnoDetalle.asistencias.length === 0) {
      return null;
    }
    
    // Buscar la primera asistencia que tenga turno
    const asistenciaConTurno = alumnoDetalle.asistencias.find(asistencia => 
      asistencia.alumno.turno && 
      typeof asistencia.alumno.turno === 'object' && 
      asistencia.alumno.turno.turno
    );
    
    if (asistenciaConTurno) {
      return asistenciaConTurno.alumno.turno;
    }
    
    return null;
  }

  // Helper para obtener las horas del turno de forma segura
  getTurnoHoras(turno: any): string {
    if (!turno) return '';
    if (typeof turno === 'object' && turno.hora_inicio && turno.hora_fin) {
      return `${turno.hora_inicio} - ${turno.hora_fin}`;
    }
    return '';
  }

  ngOnInit() {
    this.cargarAsistencias();
    this.cargarTurnos();
  }

  cargarAsistencias() {
    this.loading = true;
    this.error = null;
    this.cdr.detectChanges(); // Forzar actualización del loading

    this.asistenciaService.getAllAsistencias().subscribe({
      next: (data) => {
        this.asistencias = data;
        this.asistenciasFiltradas = [...data];
        this.extraerDatosUnicos();
        this.aplicarOrdenamiento();
        this.loading = false;
        this.cdr.detectChanges(); // Forzar actualización cuando termine
      },
      error: (error) => {
        this.alertsService.error('No se pudieron cargar los datos de asistencia. Verifique que el servidor esté funcionando.', 'Error de Carga');
        this.error = 'No se pudieron cargar los datos de asistencia. Verifique que el servidor esté funcionando.';
        this.loading = false;
        this.cdr.detectChanges(); // Forzar actualización del error
      }
    });
  }

  cargarTurnos() {
    this.asistenciaService.getAllTurnos().subscribe({
      next: (turnos) => {
        this.turnosUnicos = turnos.map(turno => turno.turno).sort();
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.alertsService.error('Error al cargar los turnos disponibles', 'Error de Carga');
        this.extraerTurnosDeAsistencias();
        this.cdr.detectChanges();
      }
    });
  }

  extraerTurnosDeAsistencias() {
    const turnos = new Set<string>();
    this.asistencias.forEach(asistencia => {
      const turnoDisplay = this.getTurnoDisplay(asistencia.alumno.turno);
      if (turnoDisplay !== 'Sin turno') {
        turnos.add(turnoDisplay);
      }
    });
    this.turnosUnicos = Array.from(turnos).sort();
  }

  extraerDatosUnicos() {
    const niveles = new Set<string>();
    const grados = new Set<number>();
    const secciones = new Set<string>();

    this.asistencias.forEach(asistencia => {
      if (asistencia.alumno.nivel) {
        niveles.add(asistencia.alumno.nivel);
      }
      if (asistencia.alumno.grado) {
        grados.add(asistencia.alumno.grado);
      }
      if (asistencia.alumno.seccion) {
        secciones.add(asistencia.alumno.seccion);
      }
    });

    this.nivelesUnicos = Array.from(niveles).sort();
    this.gradosUnicos = Array.from(grados).sort((a, b) => a - b);
    this.seccionesUnicas = Array.from(secciones).sort();
  }

  aplicarFiltros() {
    this.asistenciasFiltradas = this.asistencias.filter(asistencia => {
      // Búsqueda general
      if (this.filtros.busquedaGeneral) {
        const termino = this.filtros.busquedaGeneral.toLowerCase();
        const nombreCompleto = `${asistencia.alumno.nombre} ${asistencia.alumno.apellido}`.toLowerCase();
        const codigo = asistencia.alumno.codigo.toLowerCase();

        if (!nombreCompleto.includes(termino) && !codigo.includes(termino)) {
          return false;
        }
      }

      // Filtro por estado
      if (this.filtros.estadoAsistencia && asistencia.estado_asistencia !== this.filtros.estadoAsistencia) {
        return false;
      }

      // Filtro por turno
              if (this.filtros.turno && this.getTurnoDisplay(asistencia.alumno.turno) !== this.filtros.turno) {
        return false;
      }

      // Filtro por nivel
      if (this.filtros.nivel && asistencia.alumno.nivel !== this.filtros.nivel) {
        return false;
      }

      // Filtro por grado
      if (this.filtros.grado && asistencia.alumno.grado.toString() !== this.filtros.grado) {
        return false;
      }

      // Filtro por sección
      if (this.filtros.seccion && asistencia.alumno.seccion !== this.filtros.seccion) {
        return false;
      }

      // Filtro por fecha desde
      if (this.filtros.fechaDesde) {
        const fechaAsistencia = new Date(asistencia.fecha);
        const fechaDesde = new Date(this.filtros.fechaDesde);
        if (fechaAsistencia < fechaDesde) {
          return false;
        }
      }

      // Filtro por fecha hasta
      if (this.filtros.fechaHasta) {
        const fechaAsistencia = new Date(asistencia.fecha);
        const fechaHasta = new Date(this.filtros.fechaHasta);
        if (fechaAsistencia > fechaHasta) {
          return false;
        }
      }

      return true;
    });

    this.paginaActual = 1; // Resetear a primera página
    this.aplicarOrdenamiento();
    this.cdr.detectChanges(); 
  }

  limpiarFiltros() {
    this.filtros = {
      busquedaGeneral: '',
      estadoAsistencia: '',
      turno: '',
      fechaDesde: '',
      fechaHasta: '',
      nivel: '',
      grado: '',
      seccion: ''
    };
    this.aplicarFiltros();
    this.cdr.detectChanges();
  }

  ordenarPor(campo: string) {
    if (this.ordenActual.campo === campo) {
      this.ordenActual.direccion = this.ordenActual.direccion === 'asc' ? 'desc' : 'asc';
    } else {
      this.ordenActual.campo = campo;
      this.ordenActual.direccion = 'asc';
    }
    this.aplicarOrdenamiento();
  }

  aplicarOrdenamiento() {
    this.asistenciasFiltradas.sort((a, b) => {
      let valorA: any;
      let valorB: any;

      // Obtener valores según el campo
      switch (this.ordenActual.campo) {
        case 'alumno.codigo':
          valorA = a.alumno.codigo;
          valorB = b.alumno.codigo;
          break;
        case 'alumno.nombre':
          valorA = `${a.alumno.nombre} ${a.alumno.apellido}`;
          valorB = `${b.alumno.nombre} ${b.alumno.apellido}`;
          break;
        case 'alumno.nivel':
          valorA = `${a.alumno.nivel} ${a.alumno.grado}${a.alumno.seccion}`;
          valorB = `${b.alumno.nivel} ${b.alumno.grado}${b.alumno.seccion}`;
          break;
        case 'alumno.turno.turno':
          valorA = this.getTurnoDisplay(a.alumno.turno);
          valorB = this.getTurnoDisplay(b.alumno.turno);
          break;
        case 'fecha':
          valorA = new Date(a.fecha);
          valorB = new Date(b.fecha);
          break;
        case 'hora_de_llegada':
          valorA = a.hora_de_llegada;
          valorB = b.hora_de_llegada;
          break;
        case 'hora_salida':
          valorA = a.hora_salida || '';
          valorB = b.hora_salida || '';
          break;
        case 'estado_asistencia':
          valorA = a.estado_asistencia;
          valorB = b.estado_asistencia;
          break;
        default:
          return 0;
      }

      // Comparar valores
      if (valorA < valorB) return this.ordenActual.direccion === 'asc' ? -1 : 1;
      if (valorA > valorB) return this.ordenActual.direccion === 'asc' ? 1 : -1;
      return 0;
    });
    this.cdr.detectChanges();
  }

  // Paginación
  getTotalPaginas(): number {
    return Math.ceil(this.asistenciasFiltradas.length / this.itemsPorPagina);
  }

  getPaginatedData(): Asistencia[] {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    return this.asistenciasFiltradas.slice(inicio, fin);
  }

  getPaginasVisibles(): number[] {
    const totalPaginas = this.getTotalPaginas();
    const paginasVisibles: number[] = [];
    const rango = 2;

    let inicio = Math.max(1, this.paginaActual - rango);
    let fin = Math.min(totalPaginas, this.paginaActual + rango);

    for (let i = inicio; i <= fin; i++) {
      paginasVisibles.push(i);
    }

    return paginasVisibles;
  }

  irAPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.getTotalPaginas()) {
      this.paginaActual = pagina;
      this.cdr.detectChanges();
    }
  }

  irAPaginaAnterior() {
    if (this.paginaActual > 1) {
      this.paginaActual--;
      this.cdr.detectChanges();
    }
  }

  irAPaginaSiguiente() {
    if (this.paginaActual < this.getTotalPaginas()) {
      this.paginaActual++;
    }
  }

  irAPrimeraPagina() {
    this.paginaActual = 1;
  }

  irAUltimaPagina() {
    this.paginaActual = this.getTotalPaginas();
  }

  cambiarItemsPorPagina() {
    this.paginaActual = 1;
    this.cdr.detectChanges();
  }

  // Modal de detalle
  verDetalleAlumno(codigo: string) {
    this.mostrarModalDetalle = true;
    this.alumnoDetalle = null;
    this.cdr.detectChanges(); // Forzar detección de cambios

    this.asistenciaService.getAsistenciaPorCodigoAlumno(codigo).subscribe({
      next: (data) => {
        this.alumnoDetalle = data;
        this.cdr.detectChanges(); // Forzar detección de cambios aquí también
      },
      error: (error) => {
        this.alertsService.error('Error al cargar el detalle del alumno', 'Error de Carga');
        this.cerrarModalDetalle();
        this.cdr.detectChanges();
      }
    });
  }

  cerrarModalDetalle() {
    this.mostrarModalDetalle = false;
    this.alumnoDetalle = null;
    this.cdr.detectChanges(); // También aquí por si acaso
  }

  // Exportaciones
  exportarExcel() {
    const datosParaExportar = this.asistenciasFiltradas.map(asistencia => ({
      'Código': asistencia.alumno.codigo,
      'DNI': asistencia.alumno.dni_alumno,
      'Nombre': asistencia.alumno.nombre,
      'Apellido': asistencia.alumno.apellido,
      'Nivel': asistencia.alumno.nivel,
      'Grado': asistencia.alumno.grado,
      'Sección': asistencia.alumno.seccion,
              'Turno': this.getTurnoDisplay(asistencia.alumno.turno),
        'Hora Inicio Turno': this.getTurnoHoras(asistencia.alumno.turno),
        'Hora Fin Turno': this.getTurnoHoras(asistencia.alumno.turno),
      'Fecha': this.formatearFecha(asistencia.fecha),
      'Hora Llegada': asistencia.hora_de_llegada,
      'Hora Salida': asistencia.hora_salida || 'No registrada',
      'Estado': asistencia.estado_asistencia
    }));

    const worksheet = XLSX.utils.json_to_sheet(datosParaExportar);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Asistencias');

    const fecha = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `asistencias_${fecha}.xlsx`);
  }

  exportarPDF() {
    const doc = new jsPDF();

    // Título
    doc.setFontSize(16);
    doc.text('Lista de Asistencia', 14, 15);

    // Fecha de generación
    doc.setFontSize(10);
    doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 25);
    doc.text(`Total de registros: ${this.asistenciasFiltradas.length}`, 14, 30);

    // Datos para la tabla
    const columns = [
      'Código', 'Nombre', 'Nivel', 'Turno', 'Fecha', 'Llegada', 'Salida', 'Estado'
    ];

    const rows = this.asistenciasFiltradas.map(asistencia => [
      asistencia.alumno.codigo,
      `${asistencia.alumno.nombre} ${asistencia.alumno.apellido}`,
      `${asistencia.alumno.nivel} ${asistencia.alumno.grado}°${asistencia.alumno.seccion}`,
              this.getTurnoDisplay(asistencia.alumno.turno),
      this.formatearFecha(asistencia.fecha),
      asistencia.hora_de_llegada,
      asistencia.hora_salida || 'No reg.',
      asistencia.estado_asistencia
    ]);

    // Generar tabla
    (doc as any).autoTable({
      head: [columns],
      body: rows,
      startY: 35,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] }
    });

    // Guardar PDF
    const fecha = new Date().toISOString().split('T')[0];
    doc.save(`asistencias_${fecha}.pdf`);
  }

  // Utilidades
  formatearFecha(fecha: Date | string): string {
    const fechaObj = new Date(fecha);
    return fechaObj.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  getEstadoClasses(estado: string): string {
    const baseClasses = 'inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold shadow-sm';

    switch (estado) {
      case 'PUNTUAL':
        return `${baseClasses} bg-green-100 text-green-800 border border-green-200`;
      case 'TARDANZA':
        return `${baseClasses} bg-red-100 text-red-800 border border-red-200`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 border border-gray-200`;
    }
  }
  getRowClasses(asistencia: Asistencia, isEven: boolean): string {
    let classes = isEven ? 'bg-gray-50/30' : 'bg-white';

    if (asistencia.estado_asistencia === 'TARDANZA') {
      classes += ' hover:from-red-50 hover:to-pink-50 border-l-4 border-red-300';
    } else if (asistencia.estado_asistencia === 'PUNTUAL') {
      classes += ' hover:from-green-50 hover:to-emerald-50 border-l-4 border-green-300';
    } else {
      classes += ' hover:from-blue-50 hover:to-indigo-50';
    }

    return classes;
  }
  getPageButtonClasses(pagina: number): string {
    if (this.paginaActual === pagina) {
      return 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-2 border-blue-600';
    }
    return 'bg-white border-2 border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700';
  }

  getPuntualesCount(): number {
    return this.asistenciasFiltradas.filter(a => a.estado_asistencia === 'PUNTUAL').length;
  }

  getTardanzasCount(): number {
    return this.asistenciasFiltradas.filter(a => a.estado_asistencia === 'TARDANZA').length;
  }
  // Agregar estos métodos para el modal mejorado

  getAsistenciasPuntualesModal(): number {
    if (!this.alumnoDetalle?.asistencias) return 0;
    return this.alumnoDetalle.asistencias.filter(a => a.estado_asistencia === 'PUNTUAL').length;
  }

  getTardanzasModal(): number {
    if (!this.alumnoDetalle?.asistencias) return 0;
    return this.alumnoDetalle.asistencias.filter(a => a.estado_asistencia === 'TARDANZA').length;
  }

  getPorcentajePuntualidad(): number {
    if (!this.alumnoDetalle?.asistencias || this.alumnoDetalle.asistencias.length === 0) return 0;
    const puntuales = this.getAsistenciasPuntualesModal();
    return Math.round((puntuales / this.alumnoDetalle.asistencias.length) * 100);
  }

  getModalRowClasses(asistencia: Asistencia, isEven: boolean): string {
    let classes = isEven ? 'bg-gray-50/50' : 'bg-white';

    if (asistencia.estado_asistencia === 'TARDANZA') {
      classes += ' hover:from-red-50 hover:to-pink-50 border-l-4 border-red-300';
    } else if (asistencia.estado_asistencia === 'PUNTUAL') {
      classes += ' hover:from-green-50 hover:to-emerald-50 border-l-4 border-green-300';
    } else {
      classes += ' hover:from-blue-50 hover:to-indigo-50';
    }

    return classes;
  }

  // Si quieres añadir navegación con ESC para cerrar el modal
  @HostListener('keydown.escape')
  cerrarModalConEscape() {
    if (this.mostrarModalDetalle) {
      this.cerrarModalDetalle();
    }
  }

  // Opcional: Agregar navegación con teclado
  @HostListener('keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (event.target && (event.target as HTMLElement).tagName === 'INPUT') {
      return; // No interferir con inputs
    }

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        this.irAPaginaAnterior();
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.irAPaginaSiguiente();
        break;
      case 'Home':
        event.preventDefault();
        this.irAPrimeraPagina();
        break;
      case 'End':
        event.preventDefault();
        this.irAUltimaPagina();
        break;
    }
  }

  getEstadoClassesImproved(estado: string): string {
    const baseClasses = 'inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold shadow-sm border-2';

    switch (estado) {
      case 'PUNTUAL':
        return `${baseClasses} bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200 shadow-green-100`;
      case 'TARDANZA':
        return `${baseClasses} bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border-red-200 shadow-red-100`;
      default:
        return `${baseClasses} bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-200`;
    }
  }

  trackByAsistencia(index: number, asistencia: Asistencia): string {
    return asistencia.id_asistencia;
  }
  // Agregar estos métodos a tu componente
  getAsistenciasPuntuales(): number {
    if (!this.alumnoDetalle?.asistencias) return 0;
    return this.alumnoDetalle.asistencias.filter(a => a.estado_asistencia === 'PUNTUAL').length;
  }

  getTardanzas(): number {
    if (!this.alumnoDetalle?.asistencias) return 0;
    return this.alumnoDetalle.asistencias.filter(a => a.estado_asistencia === 'TARDANZA').length;
  }

  // Métodos para los nuevos estados de asistencia
  getAusenciasModal(): number {
    if (!this.alumnoDetalle?.asistencias) return 0;
    return this.alumnoDetalle.asistencias.filter(a => a.estado_asistencia === 'AUSENTE').length;
  }

  getAnuladosModal(): number {
    if (!this.alumnoDetalle?.asistencias) return 0;
    return this.alumnoDetalle.asistencias.filter(a => a.estado_asistencia === 'ANULADO').length;
  }

  getJustificadosModal(): number {
    if (!this.alumnoDetalle?.asistencias) return 0;
    return this.alumnoDetalle.asistencias.filter(a => a.estado_asistencia === 'JUSTIFICADO').length;
  }
  getItemsShown(): number {
    return Math.min(this.paginaActual * this.itemsPorPagina, this.asistenciasFiltradas.length);
  }
}