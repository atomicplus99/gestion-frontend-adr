import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { AusenciasMasivasService } from './services/ausencias-masivas.service';
import { WebSocketService } from '../../../shared/services/websocket.service';
import { AlertsService } from '../../../shared/alerts.service';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { 
  ResultadoEjecucion, 
  EstadisticasAusencias,
  EjecucionAusenciasMasivas,
  RespuestaProgramacion,
  AusenciaProgramada,
  RespuestaCancelacion,
  RespuestaEliminacionHistorial,
  TurnosDisponibles 
} from './interfaces/ausencias-masivas.interface';

@Component({
  selector: 'app-ausencias-masivas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ConfirmationDialogComponent],
  templateUrl: './ausencias-masivas.component.html',
  styleUrls: ['./ausencias-masivas.component.css']
})
export class AusenciasMasivasComponent implements OnInit, OnDestroy {
  
  // Formulario principal
  ejecucionForm!: FormGroup;
  
  // Estados del componente
  isLoading = false;
  isExecuting = false;
  isCancelling = false;
  isDeletingHistorial = false;
  showEstadisticas = false;
  
  // Datos del componente
  resultadoEjecucion?: ResultadoEjecucion;
  estadisticas?: EstadisticasAusencias;
  historialEjecuciones: EjecucionAusenciasMasivas[] = [];
  ausenciasProgramadas: AusenciaProgramada[] = [];
  

  // Modal de confirmación para eliminar historial
  confirmationDialog: ConfirmationDialogData = {
    title: 'Confirmar Eliminación',
    message: '¿Estás seguro de que quieres eliminar TODO el historial de ejecuciones? Esta acción es irreversible.',
    confirmText: 'Eliminar Todo',
    cancelText: 'Cancelar',
    type: 'danger',
    show: false
  };
  
  // Fecha y hora actual
  fechaActual: string;
  horaActual: string;
  
  // Timer para actualizar hora en tiempo real
  private horaTimer: any;
  
  // Opciones de turnos disponibles para programación
  turnosDisponibles = [
    { value: 'MAÑANA', label: 'Solo Mañana' },
    { value: 'TARDE', label: 'Solo Tarde' },
    { value: 'AMBOS', label: 'Ambos Turnos' }
  ];
  

  
  // Destructor para observables
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private ausenciasMasivasService: AusenciasMasivasService,
    private webSocketService: WebSocketService,
    private cdr: ChangeDetectorRef,
    private alertsService: AlertsService
  ) {
    this.fechaActual = this.obtenerFechaActualPeru();
    this.horaActual = this.obtenerHoraActualPeru();
  }

  ngOnInit() {
    this.initForm();
    this.cargarEstadisticas();
    this.cargarHistorial();
    this.cargarAusenciasProgramadas();
    this.setupWebSocketListeners();
    this.iniciarTimerHora();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    
    // Limpiar timer de hora
    if (this.horaTimer) {
      clearInterval(this.horaTimer);
    }
  }

  /**
   * Inicia el timer para actualizar la hora en tiempo real
   */
  private iniciarTimerHora(): void {
    // Actualizar hora inmediatamente
    this.actualizarHoraActual();
    
    // Actualizar cada minuto
    this.horaTimer = setInterval(() => {
      this.actualizarHoraActual();
    }, 60000); // 60000ms = 1 minuto
  }

  /**
   * Actualiza la hora actual
   */
  private actualizarHoraActual(): void {
    this.horaActual = this.obtenerHoraActualPeru();
  }

  /**
   * Valida que la fecha y hora de programación sean futuras
   */
  private validarFechaYHoraProgramacion(fecha: string, hora: string): boolean {
    if (!fecha || !hora) return false;
    
    // Obtener fecha y hora actual
    const ahora = new Date();
    const fechaActualPeru = this.obtenerFechaActualPeru();
    const horaActualPeru = this.obtenerHoraActualPeru();
    
    // Crear objeto Date para la fecha/hora a validar
    const [año, mes, dia] = fecha.split('-').map(Number);
    const [horas, minutos, segundos] = hora.split(':').map(Number);
    
    const fechaHoraProgramacion = new Date(año, mes - 1, dia, horas, minutos, segundos);
    
    // Crear objeto Date para la fecha/hora actual
    const [añoActual, mesActual, diaActual] = fechaActualPeru.split('-').map(Number);
    const [horasActual, minutosActual, segundosActual] = horaActualPeru.split(':').map(Number);
    
    const fechaHoraActual = new Date(añoActual, mesActual - 1, diaActual, horasActual, minutosActual, segundosActual);
    
    return fechaHoraProgramacion > fechaHoraActual;
  }

  /**
   * Muestra el modal de confirmación para eliminar historial
   */
  mostrarConfirmacionEliminarHistorial(): void {
    this.confirmationDialog.show = true;
  }

  /**
   * Confirma la eliminación del historial
   */
  async confirmarEliminarHistorial(): Promise<void> {
    // Ocultar el modal
    this.confirmationDialog.show = false;
    
    this.isDeletingHistorial = true;
    
    try {
      const resultado = await this.ausenciasMasivasService.eliminarHistorial(true).toPromise();
      
      if (resultado) {
        this.alertsService.success(`Se eliminaron exitosamente ${resultado.registrosEliminados} registros del historial`, 'Historial Eliminado');
        
        // Limpiar el historial local
        this.historialEjecuciones = [];
        
        // Recargar estadísticas
        await this.cargarEstadisticas();
      }
    } catch (error: any) {
      let mensajeError = 'Error al eliminar el historial';
      
      if (error.error?.message) {
        mensajeError = error.error.message;
      } else if (error.message) {
        mensajeError = error.message;
      }
      
      this.alertsService.error(mensajeError, 'Error de Eliminación');
    } finally {
      this.isDeletingHistorial = false;
      this.cdr.detectChanges();
    }
  }

  /**
   * Cancela la eliminación del historial
   */
  cancelarEliminarHistorial(): void {
    this.confirmationDialog.show = false;
  }

  /**
   * Configura los listeners de WebSocket para actualizaciones en tiempo real
   */
  private setupWebSocketListeners(): void {
    // Escuchar nuevas ausencias programadas
    this.webSocketService.ausenciaProgramada$
      .pipe(takeUntil(this.destroy$))
      .subscribe((nuevaAusencia: AusenciaProgramada) => {
        
        // Agregar la nueva ausencia a la lista
        this.ausenciasProgramadas = [...this.ausenciasProgramadas, nuevaAusencia];
        
        // Mostrar mensaje de éxito
        this.alertsService.success(`Se programó exitosamente una nueva ausencia para el ${this.formatearFecha(nuevaAusencia.fecha)} a las ${nuevaAusencia.hora}`, 'Ausencia Programada');
        
        this.cdr.detectChanges();
      });

    // Escuchar ausencias canceladas
    this.webSocketService.ausenciaCancelada$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: { id: string; fecha_cancelacion: string }) => {

        
        // Remover la ausencia cancelada de la lista
        this.ausenciasProgramadas = this.ausenciasProgramadas.filter(
          ausencia => ausencia.id !== data.id
        );
        
        // Mostrar mensaje de éxito
        this.alertsService.success('Se canceló exitosamente una ausencia programada', 'Ausencia Cancelada');
        
        this.cdr.detectChanges();
      });

    // Escuchar eventos de programación creada
    this.webSocketService.programacionCreada$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: {
        programacion: AusenciaProgramada;
        historial: any[];
        programadas: AusenciaProgramada[];
        timestamp: string;
      }) => {

        
        // Actualizar todos los datos automáticamente
        this.ausenciasProgramadas = data.programadas;
        this.historialEjecuciones = data.historial;
        
        // Mostrar mensaje de éxito
        this.alertsService.success(`Se programó exitosamente una nueva ausencia para el ${this.formatearFecha(data.programacion.fecha)} a las ${data.programacion.hora}`, 'Programación Creada');
        
        this.cdr.detectChanges();
      });

    // Escuchar eventos de programación cancelada
    this.webSocketService.programacionCancelada$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: {
        programacion_id: string;
        historial: any[];
        programadas: AusenciaProgramada[];
        timestamp: string;
      }) => {

        
        // Actualizar todos los datos automáticamente
        this.ausenciasProgramadas = data.programadas;
        this.historialEjecuciones = data.historial;
        
        // Mostrar mensaje de éxito
        this.alertsService.success('La programación de ausencias fue cancelada exitosamente', 'Programación Cancelada');
        
        this.cdr.detectChanges();
      });
  }

  /**
   * Inicializa el formulario de programación
   */
  initForm() {
    // Obtener fecha y hora actual de Perú
    const fechaActualPeru = this.obtenerFechaActualPeru();
    const horaActual = this.obtenerHoraActualPeru();
    

    
    this.ejecucionForm = this.fb.group({
      fecha: [fechaActualPeru, [Validators.required]],
      hora: [horaActual, [Validators.required]],
      turnos: ['MAÑANA', [Validators.required]]
    });

    // Escuchar cambios en la fecha para validar
    this.ejecucionForm.get('fecha')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(fecha => {
        if (fecha) {
          const esFechaValida = this.validarFechaYHoraProgramacion(fecha, this.ejecucionForm.get('hora')?.value);
          if (!esFechaValida) {
            this.ejecucionForm.get('fecha')?.setErrors({ fechaHoraPasada: true });
          } else {
            this.ejecucionForm.get('fecha')?.setErrors(null);
          }
        }
      });

    // Escuchar cambios en la hora para validar
    this.ejecucionForm.get('hora')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(hora => {
        if (hora) {
          const esHoraValida = this.validarFechaYHoraProgramacion(this.ejecucionForm.get('fecha')?.value, hora);
          if (!esHoraValida) {
            this.ejecucionForm.get('hora')?.setErrors({ fechaHoraPasada: true });
          } else {
            this.ejecucionForm.get('hora')?.setErrors(null);
          }
        }
      });
  }

  /**
   * Programa ausencias automáticas para una fecha y hora futura
   */
  async programarAusencias() {
    
    if (this.ejecucionForm.invalid) {
      Object.keys(this.ejecucionForm.controls).forEach(key => {
        const control = this.ejecucionForm.get(key);
        if (control?.errors) {
        }
      });
      
      this.alertsService.error('Por favor, corrige los errores en el formulario antes de continuar', 'Formulario Inválido');
      return;
    }

    const fecha = this.ejecucionForm.get('fecha')?.value;
    const hora = this.ejecucionForm.get('hora')?.value;
    const turnos = this.ejecucionForm.get('turnos')?.value as 'MAÑANA' | 'TARDE' | 'AMBOS';
    
    // Validar que la fecha y hora sean futuras
    if (!this.validarFechaYHoraProgramacion(fecha, hora)) {
      this.alertsService.error('No se puede programar para fechas u horas pasadas. La programación debe ser futura.', 'Fecha/Hora Inválida');
      return;
    }
    

    this.isExecuting = true;
    
    try {
      
      // Log del payload que se enviará
      const payload = {
        fecha: fecha,
        hora: hora,
        turnos: turnos
      };
      
      
      const resultado = await this.ausenciasMasivasService.programarAusencias(fecha, hora, turnos).toPromise();
      

      
      if (resultado) {
        
        this.alertsService.success(`Se programaron ausencias automáticas para el ${this.formatearFecha(fecha)} a las ${hora} para el turno: ${turnos}`, 'Ausencias Programadas Exitosamente');
        
        // Limpiar formulario (la lista se actualizará via WebSocket)
        this.limpiarFormulario();
      }
    } catch (error: any) {
      console.error('❌ ERROR EN PROGRAMACIÓN DE AUSENCIAS:');
      console.error('  - Error completo:', error);
      console.error('  - Tipo de error:', typeof error);
      console.error('  - Mensaje de error:', error.message);
      console.error('  - Status del error:', error.status);
      console.error('  - Error del backend:', error.error);
      
      let mensajeError = 'Error al programar las ausencias automáticas';
      
      if (error.error?.message) {
        mensajeError = error.error.message;
      } else if (error.message) {
        mensajeError = error.message;
      }
      
      this.alertsService.error(mensajeError, 'Error de Programación');
    } finally {
      this.isExecuting = false;
      this.cdr.detectChanges();
    }
  }

  /**
   * Carga las estadísticas de ausencias
   */
  async cargarEstadisticas() {
    this.isLoading = true;
    
    try {
      const fecha = this.ejecucionForm.get('fecha')?.value || this.fechaActual;
      const turnos = (this.ejecucionForm.get('turnos')?.value || TurnosDisponibles.AMBOS) as 'MAÑANA' | 'TARDE' | 'AMBOS';
      const estadisticas = await this.ausenciasMasivasService.obtenerEstadisticas(fecha, turnos).toPromise();
      
      if (estadisticas) {
        this.estadisticas = estadisticas;
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  /**
   * Carga las ausencias programadas
   */
  async cargarAusenciasProgramadas() {
    try {
      // Obtener todas las ausencias programadas (sin filtrar por usuario)
      const programadas = await this.ausenciasMasivasService.obtenerAusenciasProgramadas(false).toPromise();
      
      if (programadas && Array.isArray(programadas)) {
        this.ausenciasProgramadas = programadas;
        
        if (this.ausenciasProgramadas.length === 0) {
          // No hay ausencias programadas
        }
      } else {
        this.ausenciasProgramadas = [];
      }
    } catch (error) {
      this.ausenciasProgramadas = [];
    }
  }

  /**
   * Carga el historial de ejecuciones
   */
  async cargarHistorial() {
    try {
      const historial = await this.ausenciasMasivasService.obtenerHistorial().toPromise();
      
      if (historial) {
        this.historialEjecuciones = historial;
      } else {
        this.historialEjecuciones = [];
      }
    } catch (error) {
      this.historialEjecuciones = [];
    }
  }

  /**
   * Cambia la fecha y recarga estadísticas
   */
  onFechaChange() {
    this.cargarEstadisticas();
  }

  /**
   * Muestra/oculta el panel de estadísticas
   */
  toggleEstadisticas() {
    this.showEstadisticas = !this.showEstadisticas;
  }

  /**
   * Obtiene la clase CSS para el estado de ejecución
   */
  getEstadoClase(estado: string): string {
    switch (estado) {
      case 'PROGRAMADA':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETADO':
        return 'bg-green-100 text-green-800';
      case 'EN_PROCESO':
        return 'bg-yellow-100 text-yellow-800';
      case 'ERROR':
        return 'bg-red-100 text-red-800';
      case 'CANCELADA':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Formatea una fecha para mostrar
   */
  formatearFecha(fecha: string): string {
    return this.ausenciasMasivasService.formatearFecha(fecha);
  }

  /**
   * Obtiene el texto del botón de programación
   */
  get textoBotonProgramacion(): string {
    return this.isExecuting ? 'Programando Ausencias...' : 'Programar Ausencias Automáticas';
  }

  /**
   * Obtiene si el botón está deshabilitado
   */
  get botonDeshabilitado(): boolean {
    return this.isExecuting || this.ejecucionForm.invalid;
  }


  /**
   * Limpia el formulario y resetea el estado
   */
  limpiarFormulario() {
    const fechaActual = this.obtenerFechaActualPeru();
    const horaActual = this.obtenerHoraActualPeru();
    
    this.ejecucionForm.reset({ 
      fecha: fechaActual,
      hora: horaActual,
      turnos: 'MAÑANA'
    });
    this.resultadoEjecucion = undefined;
    this.showEstadisticas = false;
  }

  /**
   * Obtiene la etiqueta del turno seleccionado
   */
  get turnoSeleccionadoLabel(): string {
    const turno = this.ejecucionForm.get('turnos')?.value as 'MAÑANA' | 'TARDE' | 'AMBOS';
    if (!turno) return 'Sin turno seleccionado';
    
    const opcion = this.turnosDisponibles.find(t => t.value === turno);
    return opcion?.label || turno;
  }

  /**
   * Cancela una ausencia programada
   * @param ausencia Ausencia programada a cancelar
   */
  async cancelarAusencia(ausencia: AusenciaProgramada) {
    
    this.isCancelling = true;
    
    try {
      const resultado = await this.ausenciasMasivasService.cancelarAusenciaProgramada(ausencia.id).toPromise();
      
      // Verificar si la cancelación fue exitosa según la estructura actual del backend
      if (resultado?.cancelada === true || resultado?.estado === 'CANCELADA') {
        
        this.alertsService.success(`Se canceló exitosamente la ausencia programada para el ${this.formatearFecha(ausencia.fecha)} a las ${ausencia.hora}`, 'Ausencia Cancelada');
        
        // La lista se actualizará automáticamente via WebSocket
      } else {
        this.alertsService.error('La cancelación no se completó correctamente', 'Error de Cancelación');
      }
    } catch (error: any) {
      
      let mensajeError = 'Error al cancelar la ausencia programada';
      let tituloError = 'Error de Cancelación';
      
      // Manejar diferentes tipos de errores según el status code
      if (error.status === 403) {
        tituloError = 'Sin Permisos';
        mensajeError = error.error?.message || 'No tienes permisos para cancelar esta programación';
      } else if (error.status === 400) {
        tituloError = 'No se puede cancelar';
        mensajeError = error.error?.message || 'No se puede cancelar esta programación';
      } else if (error.status === 404) {
        tituloError = 'No encontrada';
        mensajeError = error.error?.message || 'Programación de ausencias no encontrada';
      } else if (error.error?.message) {
        mensajeError = error.error.message;
      } else if (error.message) {
        mensajeError = error.message;
      }
      
      this.alertsService.error(mensajeError, tituloError);
    } finally {
      this.isCancelling = false;
      this.cdr.detectChanges();
    }
  }

  /**
   * Verifica si el usuario actual puede cancelar una ausencia
   * @param ausencia Ausencia programada
   * @returns true si puede cancelar
   */
  puedeCancelarAusencia(ausencia: AusenciaProgramada): boolean {
    // Solo el usuario que programó la ausencia puede cancelarla
    // Por ahora, permitir cancelación a todos los usuarios autenticados
    // TODO: Implementar lógica específica según los requerimientos del negocio
    return true;
  }

  /**
   * Obtiene la fecha actual de Perú en formato YYYY-MM-DD
   */
  obtenerFechaActualPeru(): string {
    // Crear fecha en zona horaria de Perú (UTC-5)
    const ahora = new Date();
    const peruOffset = -5 * 60; // -5 horas en minutos
    const utc = ahora.getTime() + (ahora.getTimezoneOffset() * 60000);
    const peruTime = new Date(utc + (peruOffset * 60000));
    
    const year = peruTime.getFullYear();
    const month = String(peruTime.getMonth() + 1).padStart(2, '0');
    const day = String(peruTime.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }

  /**
   * Obtiene la fecha de mañana en Perú en formato YYYY-MM-DD
   */
  obtenerFechaMananaPeru(): string {
    const ahora = new Date();
    // Perú está en UTC-5 (PET - Peru Time)
    const peruTime = new Date(ahora.getTime() - (5 * 60 * 60 * 1000));
    // Agregar un día
    peruTime.setDate(peruTime.getDate() + 1);
    return peruTime.toISOString().split('T')[0];
  }

  /**
   * Obtiene la hora actual de Perú en formato HH:MM:SS
   */
  obtenerHoraActualPeru(): string {
    // Crear fecha en zona horaria de Perú (UTC-5)
    const ahora = new Date();
    const peruOffset = -5 * 60; // -5 horas en minutos
    const utc = ahora.getTime() + (ahora.getTimezoneOffset() * 60000);
    const peruTime = new Date(utc + (peruOffset * 60000));
    
    const hours = String(peruTime.getHours()).padStart(2, '0');
    const minutes = String(peruTime.getMinutes()).padStart(2, '0');
    const seconds = String(peruTime.getSeconds()).padStart(2, '0');
    
    return `${hours}:${minutes}:${seconds}`;
  }

  /**
   * Obtiene la hora actual en formato HH:MM:SS (método legacy)
   */
  obtenerHoraActual(): string {
    const ahora = new Date();
    return ahora.toTimeString().split(' ')[0];
  }
}
