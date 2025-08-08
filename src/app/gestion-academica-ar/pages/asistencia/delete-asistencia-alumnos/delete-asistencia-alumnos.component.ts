import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import { 
  AsistenciaService,
  Alumno,
  Asistencia,
  EstadoAsistencia,
  AnularAsistenciaRequest
} from './service/AnularAsistencia.service';
import { UserStoreService } from '../../../../auth/store/user.store'; // 🆕 IMPORTAR USERSTORE

@Component({
  selector: 'app-anular-asistencias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './delete-asistencia-alumnos.component.html', // 🆕 TEMPLATE SEPARADO
  changeDetection: ChangeDetectionStrategy.OnPush // 🆕 OPTIMIZACIÓN
})
export class AnularAsistenciasComponent implements OnInit, OnDestroy {
  // Estados principales
  estudianteSeleccionado: Alumno | null = null;
  asistenciasHoy: Asistencia[] = [];
  asistenciaSeleccionada: Asistencia | null = null;

  // Búsqueda
  codigoBusqueda = '';
  buscandoEstudiante = false;
  errorBusqueda = '';

  // Asistencias
  cargandoAsistencias = false;
  errorAsistencias = '';

  // Modal y anulación
  mostrarModal = false;
  motivoAnulacion = '';
  formularioEnviado = false;
  procesandoAnulacion = false;

  // Toasts
  mostrarToastExito = false;
  mostrarToastError = false;
  mensajeExito = '';
  mensajeError = '';

  // Fecha
  fechaHoy = '';

  // Subject para manejo de suscripciones
  private destroy$ = new Subject<void>();

  constructor(
    private asistenciaService: AsistenciaService,
    private userStore: UserStoreService, // 🆕 INYECTAR USERSTORE
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.fechaHoy = this.asistenciaService.obtenerFechaHoy();
    
    // 🆕 Verificar permisos de auxiliar al inicializar
    this.verificarPermisosAuxiliar();
    
    // 🆕 Suscribirse a cambios del usuario
    this.setupUserSubscription();
    
    console.log('🚀 Componente de anulaciones inicializado para:', this.fechaHoy);
    console.log('👤 Auxiliar actual:', this.nombreAuxiliarActual, '- ID:', this.idAuxiliarActual);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========================================
  // MÉTODOS DE INICIALIZACIÓN Y PERMISOS
  // ========================================
  
  private verificarPermisosAuxiliar(): void {
    if (!this.puedeAnularAsistencias) {
      Swal.fire({
        icon: 'error',
        title: 'Sin Permisos',
        text: 'No tienes permisos de auxiliar para anular asistencias.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#dc2626'
      });
    }
  }

  private setupUserSubscription(): void {
    // Observar cambios en el usuario para mantener actualizado el ID del auxiliar
    // Si userStore.user() es un signal, no necesitas suscripción
    // Si es un observable, descomenta la línea siguiente:
    
    // this.userStore.user()
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe(user => {
    //     this.forzarDeteccionCambios();
    //   });
  }

  // ========================================
  // GETTERS PARA AUXILIAR Y PERMISOS
  // ========================================
  
  get idAuxiliarActual(): string | null {
    return this.userStore.idAuxiliar;
  }

  get nombreAuxiliarActual(): string {
    const user = this.userStore.user();
    if (user?.auxiliarInfo) {
      return `${user.auxiliarInfo.nombre} ${user.auxiliarInfo.apellido}`;
    }
    return 'Auxiliar no identificado';
  }

  get puedeAnularAsistencias(): boolean {
    return this.userStore.puedeRegistrarAsistencia && !!this.idAuxiliarActual;
  }

  // ========================================
  // MÉTODOS DE DETECCIÓN DE CAMBIOS
  // ========================================
  
  private forzarDeteccionCambios(): void {
    this.cdr.detectChanges();
    setTimeout(() => this.cdr.detectChanges(), 0);
  }

  private forzarDeteccionConDelay(delay: number = 100): void {
    setTimeout(() => {
      this.cdr.detectChanges();
    }, delay);
  }

  // ===============================
  // FUNCIONES DE BÚSQUEDA
  // ===============================

  buscarEstudiante() {
    // 🆕 Verificar permisos antes de buscar
    if (!this.puedeAnularAsistencias) {
      this.mostrarErrorSinPermisos();
      return;
    }

    if (!this.codigoBusqueda?.trim()) {
      this.errorBusqueda = 'El código es obligatorio';
      return;
    }

    this.buscandoEstudiante = true;
    this.errorBusqueda = '';
    this.forzarDeteccionCambios();

    console.log('🔍 Buscando estudiante:', this.codigoBusqueda.trim());
    console.log('👤 Auxiliar actual:', this.nombreAuxiliarActual, '- ID:', this.idAuxiliarActual);

    this.asistenciaService.buscarAlumnoPorCodigo(this.codigoBusqueda.trim()).subscribe({
      next: (alumno) => {
        console.log('✅ Estudiante encontrado:', alumno);
        this.estudianteSeleccionado = alumno;
        this.buscandoEstudiante = false;
        this.cargarAsistenciasHoy();
        this.forzarDeteccionCambios();
      },
      error: (error) => {
        console.error('❌ Error buscando estudiante:', error);
        this.buscandoEstudiante = false;
        this.estudianteSeleccionado = null;
        this.asistenciasHoy = [];
        
        if (error.status === 404) {
          this.errorBusqueda = 'No se encontró ningún estudiante con ese código';
        } else {
          this.errorBusqueda = 'Error al buscar el estudiante. Intente nuevamente.';
        }
        
        this.forzarDeteccionCambios();
      }
    });
  }

  limpiarBusqueda() {
    this.codigoBusqueda = '';
    this.estudianteSeleccionado = null;
    this.asistenciasHoy = [];
    this.errorBusqueda = '';
    this.errorAsistencias = '';
    this.forzarDeteccionCambios();
  }

  // ===============================
  // FUNCIONES DE ASISTENCIAS
  // ===============================

  cargarAsistenciasHoy() {
    if (!this.estudianteSeleccionado) return;

    this.cargandoAsistencias = true;
    this.errorAsistencias = '';
    this.forzarDeteccionCambios();

    this.asistenciaService.obtenerAsistenciasHoyAlumno(this.estudianteSeleccionado.codigo).subscribe({
      next: (asistencias: Asistencia[]) => {
        console.log('✅ Asistencias de hoy cargadas:', asistencias.length);
        this.asistenciasHoy = asistencias.sort((a, b) => 
          a.hora_de_llegada.localeCompare(b.hora_de_llegada)
        );
        this.cargandoAsistencias = false;
        this.forzarDeteccionCambios();
      },
      error: (error) => {
        console.error('❌ Error cargando asistencias de hoy:', error);
        this.cargandoAsistencias = false;
        
        if (error.status === 404) {
          this.errorAsistencias = 'Este estudiante no tiene asistencias registradas para hoy';
          this.asistenciasHoy = [];
        } else {
          this.errorAsistencias = 'Error al cargar las asistencias. Intente nuevamente.';
        }
        
        this.forzarDeteccionCambios();
      }
    });
  }

  // ===============================
  // FUNCIONES DE ESTADO
  // ===============================

  getEstadoDelDia(): string {
    if (this.asistenciasHoy.length === 0) {
      return 'Sin registro';
    }

    if (this.tieneAsistenciaAnulada()) {
      return 'Anulado';
    }

    if (this.tieneAsistenciaPuntualOTardanza()) {
      return 'Presente';
    }

    return 'Otro estado';
  }

  tieneAsistenciaPuntualOTardanza(): boolean {
    return this.asistenciasHoy.some(a => 
      a.estado_asistencia === EstadoAsistencia.PUNTUAL || 
      a.estado_asistencia === EstadoAsistencia.TARDANZA
    );
  }

  tieneAsistenciaAnulada(): boolean {
    return this.asistenciasHoy.some(a => 
      a.estado_asistencia === EstadoAsistencia.ANULADO
    );
  }

  // ===============================
  // FUNCIONES DE ANULACIÓN
  // ===============================

  abrirModalAnular(asistencia: Asistencia) {
    // 🆕 Verificar permisos antes de abrir modal
    if (!this.puedeAnularAsistencias) {
      this.mostrarErrorSinPermisos();
      return;
    }

    this.asistenciaSeleccionada = asistencia;
    this.motivoAnulacion = '';
    this.formularioEnviado = false;
    this.mostrarModal = true;
    this.forzarDeteccionCambios();
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.asistenciaSeleccionada = null;
    this.motivoAnulacion = '';
    this.formularioEnviado = false;
    this.forzarDeteccionCambios();
  }

  confirmarAnulacion() {
    // 🆕 Verificar permisos antes de confirmar
    if (!this.puedeAnularAsistencias) {
      this.mostrarErrorSinPermisos();
      return;
    }

    if (!this.idAuxiliarActual) {
      Swal.fire({
        icon: 'error',
        title: 'Error de Auxiliar',
        text: 'No se pudo obtener el ID del auxiliar. Verifica tu sesión.',
        confirmButtonText: 'Cerrar',
        confirmButtonColor: '#d33'
      });
      return;
    }

    this.formularioEnviado = true;
    this.forzarDeteccionCambios();

    if (!(this.motivoAnulacion || '').trim()) {
      return;
    }

    if (!this.asistenciaSeleccionada || !this.estudianteSeleccionado) {
      return;
    }

    this.procesandoAnulacion = true;
    this.forzarDeteccionCambios();

    // 🆕 Usar ID dinámico del UserStore
    const request: AnularAsistenciaRequest = {
      codigo_estudiante: this.estudianteSeleccionado.codigo,
      motivo: this.motivoAnulacion.trim(),
      id_auxiliar: this.idAuxiliarActual // 🆕 ID dinámico
    };

    console.log('🗑️ Enviando solicitud de anulación para hoy:', request);
    console.log('👤 Auxiliar responsable:', this.nombreAuxiliarActual);

    this.asistenciaService.anularAsistencia(request).subscribe({
      next: (response) => {
        console.log('✅ Asistencia anulada exitosamente:', response);
        
        // Actualizar estado local
        const index = this.asistenciasHoy.findIndex(a => 
          a.id_asistencia === this.asistenciaSeleccionada!.id_asistencia
        );
        
        if (index !== -1) {
          this.asistenciasHoy[index].estado_asistencia = EstadoAsistencia.ANULADO;
        }

        this.procesandoAnulacion = false;
        this.cerrarModal();
        
        // 🆕 Mostrar éxito con información del auxiliar
        Swal.fire({
          icon: 'success',
          title: '¡Anulación Exitosa!',
          html: `
            <div style="text-align: left; font-size: 14px;">
              <p><strong>📝 Mensaje:</strong> ${response.message || 'Asistencia anulada correctamente'}</p>
              <p><strong>👤 Auxiliar:</strong> ${this.nombreAuxiliarActual}</p>
              <p><strong>🆔 ID Auxiliar:</strong> ${this.idAuxiliarActual}</p>
              <p><strong>📅 Fecha:</strong> ${new Date().toLocaleString()}</p>
            </div>
          `,
          timer: 5000,
          timerProgressBar: true,
          confirmButtonText: 'Continuar',
          confirmButtonColor: '#10b981'
        });

        this.forzarDeteccionCambios();
      },
      error: (error) => {
        console.error('❌ Error anulando asistencia:', error);
        this.procesandoAnulacion = false;
        this.cerrarModal();
        
        Swal.fire({
          icon: 'error',
          title: 'Error al Anular',
          text: error.error?.message || 'Error al anular la asistencia',
          confirmButtonText: 'Cerrar',
          confirmButtonColor: '#d33'
        });
        
        this.forzarDeteccionCambios();
      }
    });
  }

  // ===============================
  // MÉTODOS DE VALIDACIÓN Y AYUDA
  // ===============================

  /**
   * Muestra error cuando no hay permisos de auxiliar
   */
  private mostrarErrorSinPermisos(): void {
    Swal.fire({
      icon: 'error',
      title: 'Sin Permisos de Auxiliar',
      text: 'Necesitas permisos de auxiliar para realizar esta acción.',
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#dc2626'
    });
  }

  /**
   * Obtiene el texto del estado de los botones
   */
  get estadoBuscarTexto(): string {
    if (!this.puedeAnularAsistencias) return 'Sin permisos de auxiliar';
    if (this.buscandoEstudiante) return 'Buscando...';
    return 'Buscar';
  }

  get estadoAnularTexto(): string {
    if (!this.puedeAnularAsistencias) return 'Sin permisos de auxiliar';
    if (!this.idAuxiliarActual) return 'ID auxiliar no disponible';
    if (this.procesandoAnulacion) return 'Procesando...';
    return 'Confirmar Anulación';
  }

  // ===============================
  // FUNCIONES AUXILIARES (SIN CAMBIOS)
  // ===============================

  trackByAsistencia(index: number, asistencia: Asistencia): string {
    return asistencia.id_asistencia;
  }

  puedeAnular(estado: EstadoAsistencia): boolean {
    return this.asistenciaService.puedeAnular(estado) && this.puedeAnularAsistencias;
  }

  obtenerInfoEstado(estado: EstadoAsistencia) {
    return this.asistenciaService.obtenerInfoEstado(estado);
  }

  getReasonCannotCancel(estado: EstadoAsistencia): string {
    if (!this.puedeAnularAsistencias) {
      return 'Sin permisos de auxiliar';
    }

    switch (estado) {
      case EstadoAsistencia.ANULADO:
        return 'Ya está anulado';
      case EstadoAsistencia.AUSENTE:
        return 'Las ausencias no se anulan';
      case EstadoAsistencia.JUSTIFICADO:
        return 'Use interfaz de justificaciones';
      default:
        return 'Estado no anulable';
    }
  }
}
