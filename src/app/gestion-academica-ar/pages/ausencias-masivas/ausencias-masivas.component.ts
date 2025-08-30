import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { AusenciasMasivasService } from './services/ausencias-masivas.service';
import { ConfirmationMessageComponent, ConfirmationMessage } from '../../../shared/components/confirmation-message/confirmation-message.component';
import { 
  ResultadoEjecucion, 
  EstadisticasAusencias,
  EjecucionAusenciasMasivas,
  RespuestaProgramacion,
  AusenciaProgramada,
  TurnosDisponibles 
} from './interfaces/ausencias-masivas.interface';

@Component({
  selector: 'app-ausencias-masivas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ConfirmationMessageComponent],
  templateUrl: './ausencias-masivas.component.html',
  styleUrls: ['./ausencias-masivas.component.css']
})
export class AusenciasMasivasComponent implements OnInit, OnDestroy {
  
  // Formulario principal
  ejecucionForm!: FormGroup;
  
  // Estados del componente
  isLoading = false;
  isExecuting = false;
  showEstadisticas = false;
  
  // Datos del componente
  resultadoEjecucion?: ResultadoEjecucion;
  estadisticas?: EstadisticasAusencias;
  historialEjecuciones: EjecucionAusenciasMasivas[] = [];
  ausenciasProgramadas: AusenciaProgramada[] = [];
  
  // Sistema de mensajes personalizados
  confirmationMessage: ConfirmationMessage = {
    type: 'info',
    title: '',
    message: '',
    show: false
  };
  
  // Fecha y hora actual
  fechaActual: string;
  horaActual: string;
  
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
    private cdr: ChangeDetectorRef
  ) {
    this.fechaActual = this.ausenciasMasivasService.obtenerFechaActual();
    this.horaActual = this.obtenerHoraActual();
  }

  ngOnInit() {
    this.initForm();
    this.cargarEstadisticas();
    this.cargarHistorial();
    this.cargarAusenciasProgramadas();
    
    // Log para verificar que el componente se inicializó correctamente
    console.log('🚀 COMPONENTE AUSENCIAS MASIVAS INICIALIZADO:');
    console.log('  - Formulario válido:', this.ejecucionForm?.valid);
    console.log('  - Estado del formulario:', this.ejecucionForm?.status);
    console.log('  - Botón deshabilitado:', this.botonDeshabilitado);
    console.log('  - isExecuting:', this.isExecuting);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicializa el formulario de programación
   */
  initForm() {
    // Obtener fecha de mañana como fecha por defecto válida
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    const fechaManana = manana.toISOString().split('T')[0];
    
    // Obtener hora actual
    const horaActual = this.obtenerHoraActual();
    
    console.log('📅 INICIALIZANDO FORMULARIO:');
    console.log('  - Fecha por defecto (mañana):', fechaManana);
    console.log('  - Hora por defecto:', horaActual);
    console.log('  - Turnos por defecto:', ['MAÑANA']);
    console.log('  - Fecha actual del sistema:', new Date().toISOString());
    console.log('  - Fecha de mañana como Date:', new Date(fechaManana));
    
    this.ejecucionForm = this.fb.group({
      fecha: [fechaManana, [Validators.required]],
      hora: [horaActual, [Validators.required]],
      turnos: ['MAÑANA', [Validators.required]]
    });

    // Escuchar cambios en la fecha para validar
    this.ejecucionForm.get('fecha')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(fecha => {
        console.log('📅 CAMBIO EN FECHA DETECTADO:', fecha);
        console.log('  - Fecha recibida en valueChanges:', fecha);
        console.log('  - Tipo de fecha:', typeof fecha);
        console.log('  - Fecha como Date:', new Date(fecha));
        
        if (fecha && !this.ausenciasMasivasService.validarFechaProgramacion(fecha)) {
          console.log('❌ FECHA INVÁLIDA - Estableciendo error fechaFutura');
          this.ejecucionForm.get('fecha')?.setErrors({ fechaFutura: true });
        } else {
          console.log('✅ FECHA VÁLIDA - Limpiando errores');
          this.ejecucionForm.get('fecha')?.setErrors(null);
        }
        
        console.log('  - Estado del formulario después del cambio:', this.ejecucionForm.status);
        console.log('  - Errores del campo fecha:', this.ejecucionForm.get('fecha')?.errors);
      });
      
    console.log('📋 ESTADO INICIAL DEL FORMULARIO:');
    console.log('  - Válido:', this.ejecucionForm.valid);
    console.log('  - Errores:', this.ejecucionForm.errors);
    console.log('  - Valores:', this.ejecucionForm.value);
    console.log('  - Estado:', this.ejecucionForm.status);
    console.log('  - Campos del formulario:', Object.keys(this.ejecucionForm.controls));
  }

  /**
   * Programa ausencias automáticas para una fecha y hora futura
   */
  async programarAusencias() {
    console.log('🚀 INICIANDO PROGRAMACIÓN DE AUSENCIAS');
    console.log('📋 Estado del formulario:', this.ejecucionForm.valid ? 'VÁLIDO' : 'INVÁLIDO');
    console.log('📋 Errores del formulario:', this.ejecucionForm.errors);
    
    if (this.ejecucionForm.invalid) {
      console.log('❌ FORMULARIO INVÁLIDO - Detalles de errores:');
      Object.keys(this.ejecucionForm.controls).forEach(key => {
        const control = this.ejecucionForm.get(key);
        if (control?.errors) {
          console.log(`  - ${key}:`, control.errors);
        }
      });
      
      this.confirmationMessage = {
        type: 'error',
        title: 'Formulario Inválido',
        message: 'Por favor, corrige los errores en el formulario antes de continuar',
        show: true
      };
      return;
    }

    const fecha = this.ejecucionForm.get('fecha')?.value;
    const hora = this.ejecucionForm.get('hora')?.value;
    const turnos = this.ejecucionForm.get('turnos')?.value as 'MAÑANA' | 'TARDE' | 'AMBOS';
    
    console.log('📅 DATOS DEL FORMULARIO:');
    console.log('  - Fecha seleccionada:', fecha);
    console.log('  - Hora seleccionada:', hora);
    console.log('  - Turnos seleccionados:', turnos);
    console.log('  - Tipo de fecha:', typeof fecha);
    console.log('  - Fecha actual del sistema:', new Date().toISOString());
    
    // Validar fecha de programación
    const esFechaValida = this.ausenciasMasivasService.validarFechaProgramacion(fecha);
    console.log('✅ VALIDACIÓN DE FECHA:');
    console.log('  - Método validarFechaProgramacion() retorna:', esFechaValida);
    console.log('  - Fecha seleccionada como Date:', new Date(fecha));
    console.log('  - Fecha actual como Date:', new Date());
    console.log('  - Comparación fecha > hoy:', new Date(fecha) > new Date());
    
    if (!esFechaValida) {
      console.log('❌ FECHA INVÁLIDA PARA PROGRAMACIÓN');
      this.confirmationMessage = {
        type: 'error',
        title: 'Fecha Inválida',
        message: 'Solo se pueden programar ausencias para hoy o fechas futuras',
        show: true
      };
      return;
    }
    
    console.log('✅ FECHA VÁLIDA - Continuando con la programación...');

    this.isExecuting = true;
    
    try {
      console.log('🚀 ENVIANDO PETICIÓN AL BACKEND:');
      console.log('  - Fecha a programar:', fecha);
      console.log('  - Hora a programar:', hora);
      console.log('  - Turno a programar:', turnos);
      console.log('  - Tipo de turno:', typeof turnos);
      console.log('  - Turno seleccionado:', turnos);
      
      // Log del payload que se enviará
      const payload = {
        fecha: fecha,
        hora: hora,
        turnos: turnos
      };
      console.log('📤 PAYLOAD COMPLETO A ENVIAR:', payload);
      console.log('📤 JSON.stringify del payload:', JSON.stringify(payload));
      console.log('📤 Tipo de turnos en payload:', typeof payload.turnos);
      console.log('📤 Turnos como string:', payload.turnos);
      
      console.log('🌐 LLAMANDO AL SERVICIO programarAusencias()...');
      
      const resultado = await this.ausenciasMasivasService.programarAusencias(fecha, hora, turnos).toPromise();
      
      console.log('📥 RESPUESTA DEL BACKEND RECIBIDA:');
      console.log('  - Resultado completo:', resultado);
      console.log('  - Tipo de resultado:', typeof resultado);
      
      if (resultado) {
        console.log('✅ PROGRAMACIÓN EXITOSA:');
        console.log('  - ID de programación:', resultado.idProgramacion);
        console.log('  - Fecha programada:', resultado.fecha);
        console.log('  - Hora programada:', resultado.hora);
        console.log('  - Turnos programados:', resultado.turnos);
        console.log('  - Mensaje del backend:', resultado.mensaje);
        
        this.confirmationMessage = {
          type: 'success',
          title: 'Ausencias Programadas Exitosamente',
          message: `Se programaron ausencias automáticas para el ${resultado.fecha} a las ${resultado.hora} para el turno: ${turnos}`,
          show: true
        };
        
        // Recargar ausencias programadas
        console.log('🔄 Recargando ausencias programadas...');
        await this.cargarAusenciasProgramadas();
        this.limpiarFormulario();
        console.log('✅ Formulario limpiado y ausencias recargadas');
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
        console.log('  - Mensaje del backend:', error.error.message);
      } else if (error.message) {
        mensajeError = error.message;
        console.log('  - Mensaje del error:', error.message);
      }
      
      this.confirmationMessage = {
        type: 'error',
        title: 'Error de Programación',
        message: mensajeError,
        show: true
      };
    } finally {
      console.log('🏁 FINALIZANDO EJECUCIÓN:');
      console.log('  - isExecuting cambiando a false');
      this.isExecuting = false;
      console.log('  - Detectando cambios en la UI');
      this.cdr.detectChanges();
      console.log('✅ PROGRAMACIÓN COMPLETADA');
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
      console.log('🔄 CARGANDO AUSENCIAS PROGRAMADAS...');
      const programadas = await this.ausenciasMasivasService.obtenerAusenciasProgramadas().toPromise();
      
      console.log('📥 AUSENCIAS PROGRAMADAS RECIBIDAS:', programadas);
      
      if (programadas) {
        console.log('📋 DETALLES DE AUSENCIAS:');
        programadas.forEach((ausencia, index) => {
          console.log(`  - Ausencia ${index + 1}:`, {
            id: ausencia.id,
            fecha: ausencia.fecha,
            tipoFecha: typeof ausencia.fecha,
            hora: ausencia.hora,
            turnos: ausencia.turnos,
            estado: ausencia.estado
          });
        });
        
        this.ausenciasProgramadas = programadas;
        console.log('✅ Ausencias programadas cargadas en el componente');
      }
    } catch (error) {
      console.error('❌ Error cargando ausencias programadas:', error);
    }
  }

  /**
   * Carga el historial de ejecuciones
   */
  async cargarHistorial() {
    try {
      console.log('🔄 CARGANDO HISTORIAL DE EJECUCIONES...');
      const historial = await this.ausenciasMasivasService.obtenerHistorial().toPromise();
      
      console.log('📥 HISTORIAL RECIBIDO:', historial);
      
      if (historial) {
        console.log('📋 DETALLES DEL HISTORIAL:');
        historial.forEach((ejecucion, index) => {
          console.log(`  - Ejecución ${index + 1}:`, {
            id: ejecucion.id,
            fecha: ejecucion.fecha,
            tipoFecha: typeof ejecucion.fecha,
            horaEjecucion: ejecucion.horaEjecucion,
            totalAlumnos: ejecucion.totalAlumnos,
            ausenciasCreadas: ejecucion.ausenciasCreadas,
            estado: ejecucion.estado
          });
        });
        
        this.historialEjecuciones = historial;
        console.log('✅ Historial cargado en el componente');
      }
    } catch (error) {
      console.error('❌ Error cargando historial:', error);
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
    if (this.isExecuting) {
      return 'Programando Ausencias...';
    }
    return 'Programar Ausencias Automáticas';
  }

  /**
   * Obtiene si el botón está deshabilitado
   */
  get botonDeshabilitado(): boolean {
    const deshabilitado = this.isExecuting || this.ejecucionForm.invalid;
    console.log('🔘 ESTADO DEL BOTÓN:');
    console.log('  - isExecuting:', this.isExecuting);
    console.log('  - ejecucionForm.invalid:', this.ejecucionForm.invalid);
    console.log('  - Botón deshabilitado:', deshabilitado);
    console.log('  - Estado del formulario:', this.ejecucionForm.status);
    console.log('  - Errores del formulario:', this.ejecucionForm.errors);
    return deshabilitado;
  }

  /**
   * Maneja la confirmación de mensajes
   */
  onConfirmMessage(): void {
    this.confirmationMessage.show = false;
    this.cdr.detectChanges();
  }

  /**
   * Limpia el formulario y resetea el estado
   */
  limpiarFormulario() {
    this.ejecucionForm.reset({ 
      fecha: '',
      hora: '',
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
   * Obtiene la hora actual en formato HH:MM:SS
   */
  obtenerHoraActual(): string {
    const ahora = new Date();
    return ahora.toTimeString().split(' ')[0];
  }
}
