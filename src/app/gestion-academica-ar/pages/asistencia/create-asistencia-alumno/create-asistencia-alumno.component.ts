// registro-asistencia.component.ts
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

// Interfaces actualizadas
interface VerificarAsistenciaResponse {
  tiene_asistencia: boolean;
  mensaje: string;
  alumno?: {
    id_alumno: string;
    codigo: string;
    nombre: string;
    apellido: string;
    turno: {
      id_turno: string;
      hora_inicio: string;
      hora_fin: string;
      turno: string;
    };
  };
  asistencia?: {
    id_asistencia: string;
    hora_de_llegada: string;
    hora_salida: string | null;
    estado_asistencia: string;
    fecha: Date;
  };
}

// ✅ INTERFAZ ACTUALIZADA CON FECHA OPCIONAL
interface RegistroAsistenciaRequest {
  id_alumno: string;
  hora_de_llegada: string;
  hora_salida?: string;
  estado_asistencia: 'PUNTUAL' | 'TARDANZA'; // Solo estos dos estados
  motivo: string;
  id_auxiliar: string;
  fecha?: string; // ✨ NUEVO CAMPO OPCIONAL (formato YYYY-MM-DD)
}

interface RegistroAsistenciaResponse {
  message: string; // Cambiado de success + mensaje a solo message
  asistencia: {
    id_asistencia: string;
    hora_de_llegada: string;
    hora_salida?: string;
    estado_asistencia: string;
    fecha: Date;
    alumno: {
      nombre: string;
      apellido: string;
      codigo: string;
    };
  };
}

@Component({
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  selector: 'app-registro-asistencia',
  templateUrl: './create-asistencia-alumno.component.html',
})
export class RegistroAsistenciaComponent implements OnInit, OnDestroy {
  
  // Formularios
  buscarForm!: FormGroup;
  registroForm!: FormGroup;
  
  // Estados
  loading = false;
  verificando = false;
  registrando = false;
  private searchTimeout: any;
  
  // Datos del alumno
  alumnoEncontrado: any = null;
  tieneAsistencia = false;
  asistenciaExistente: any = null;
  
  // ✨ NUEVAS PROPIEDADES
  usarFechaPersonalizada = false;
  fechaHoy = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  // Configuración
  private baseUrl = 'http://localhost:3000/asistencia';
  private readonly ID_AUXILIAR_DEFAULT = '37419ff9-9ce8-4b1a-bdc6-2ed28ae8cc0b';
  
  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {
    this.initForms();
  }
  
  ngOnInit(): void {
    this.inicializarComponente();
    this.configurarValidacionesTiempoReal();
  }
  
  ngOnDestroy(): void {
    this.limpiarTimeouts();
  }
  
  private inicializarComponente(): void {
    // Configurar ID del auxiliar
    this.registroForm.patchValue({
      id_auxiliar: this.ID_AUXILIAR_DEFAULT,
      fecha: this.fechaHoy // Fecha por defecto hoy
    });
    
    // Auto-focus
    setTimeout(() => {
      const codigoInput = document.getElementById('codigo');
      if (codigoInput) {
        codigoInput.focus();
      }
    }, 100);
    
    console.log('🚀 Sistema de registro inicializado');
  }
  
  private initForms(): void {
    this.buscarForm = this.fb.group({
      codigo: ['', [
        Validators.required, 
        Validators.minLength(5),
        Validators.pattern(/^[A-Za-z0-9]+$/)
      ]]
    });
    
    // ✅ FORMULARIO ACTUALIZADO CON FECHA
    this.registroForm = this.fb.group({
      hora_de_llegada: ['', [
        Validators.required, 
        Validators.pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      ]],
      hora_salida: ['', [
        Validators.pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      ]],
      // ✅ SOLO PUNTUAL Y TARDANZA
      estado_asistencia: ['PUNTUAL', [
        Validators.required,
        Validators.pattern(/^(PUNTUAL|TARDANZA)$/) // Validación estricta
      ]],
      motivo: ['', [
        Validators.required, 
        Validators.minLength(10),
        Validators.maxLength(500)
      ]],
      id_auxiliar: ['', [Validators.required]],
      id_alumno: [''],
      // ✨ NUEVO CAMPO FECHA
      fecha: [this.fechaHoy, [
        Validators.required,
        Validators.pattern(/^\d{4}-\d{2}-\d{2}$/) // YYYY-MM-DD
      ]]
    });
  }
  
  private configurarValidacionesTiempoReal(): void {
    // Búsqueda automática
    this.buscarForm.get('codigo')?.valueChanges.subscribe(codigo => {
      this.manejarCambioCodigo(codigo);
    });
    
    // Validaciones de horarios
    this.registroForm.get('hora_de_llegada')?.valueChanges.subscribe(hora => {
      if (hora && this.alumnoEncontrado?.turno) {
        this.validarHoraTiempoReal(hora, 'llegada');
      }
    });
    
    this.registroForm.get('hora_salida')?.valueChanges.subscribe(hora => {
      if (hora && this.alumnoEncontrado?.turno) {
        this.validarHoraTiempoReal(hora, 'salida');
      }
    });

    // ✨ VALIDACIÓN DE FECHA
    this.registroForm.get('fecha')?.valueChanges.subscribe(fecha => {
      if (fecha) {
        this.validarFechaSeleccionada(fecha);
      }
    });
  }
  
  // ✨ NUEVA FUNCIÓN PARA VALIDAR FECHA
  private validarFechaSeleccionada(fecha: string): void {
    const fechaSeleccionada = new Date(fecha);
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hoy.getDate() - 30);
    
    if (fechaSeleccionada > hoy) {
      Swal.fire({
        icon: 'warning',
        title: 'Fecha Futura',
        text: 'No se pueden registrar asistencias para fechas futuras.',
        confirmButtonColor: '#f59e0b',
        timer: 4000
      });
      // Resetear a fecha de hoy
      this.registroForm.patchValue({ fecha: this.fechaHoy });
    } else if (fechaSeleccionada < hace30Dias) {
      Swal.fire({
        icon: 'warning',
        title: 'Fecha Muy Antigua',
        text: 'No se recomienda registrar asistencias de más de 30 días atrás.',
        confirmButtonColor: '#f59e0b',
        timer: 4000
      });
    }
  }

  // ✨ FUNCIÓN PARA ALTERNAR USO DE FECHA PERSONALIZADA
  toggleFechaPersonalizada(): void {
    this.usarFechaPersonalizada = !this.usarFechaPersonalizada;
    
    if (!this.usarFechaPersonalizada) {
      // Volver a fecha de hoy
      this.registroForm.patchValue({ fecha: this.fechaHoy });
    }
    
    this.forzarActualizacionDOM();
  }

  // ✨ FUNCIÓN PARA ESTABLECER FECHA RÁPIDA
  establecerFechaRapida(dias: number): void {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + dias);
    const fechaStr = fecha.toISOString().split('T')[0];
    
    this.registroForm.patchValue({ fecha: fechaStr });
    this.forzarActualizacionDOM();
  }
  
  private manejarCambioCodigo(codigo: string): void {
    if (!codigo) {
      this.limpiarEstadosAnteriores();
      return;
    }
    
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    if (codigo.length >= 8) {
      this.searchTimeout = setTimeout(() => {
        this.verificarAsistencia();
      }, 800);
    }
  }
  
  async verificarAsistencia(): Promise<void> {
    if (this.verificando) return;

    if (this.buscarForm.invalid) {
      await this.mostrarError(
        'Código Inválido', 
        'Por favor ingrese un código válido (mínimo 5 caracteres, solo letras y números).'
      );
      return;
    }
    
    const codigo = this.buscarForm.get('codigo')?.value?.trim().toUpperCase();
    if (!codigo || codigo.length < 5) {
      await this.mostrarError(
        'Código Muy Corto',
        `El código debe tener al menos 5 caracteres. Actual: ${codigo?.length || 0}`
      );
      return;
    }
    
    this.verificando = true;
    this.limpiarEstadosAnteriores();
    this.forzarActualizacionDOM();
    
    try {
      console.log(`🔍 Verificando código: ${codigo}`);
      
      // ✅ AGREGAR FECHA A LA VERIFICACIÓN
      const fechaVerificar = this.registroForm.get('fecha')?.value || this.fechaHoy;
      const response = await this.http.get<VerificarAsistenciaResponse>(
        `${this.baseUrl}/verificar/${codigo}?fecha=${fechaVerificar}`
      ).toPromise();
      
      console.log('📦 Respuesta:', response);
      
      // CAMBIOS INSTANTÁNEOS EN EL DOM
      if (response?.tiene_asistencia === true) {
        // 🚀 ACTUALIZACIÓN INMEDIATA DEL DOM
        this.tieneAsistencia = true;
        this.asistenciaExistente = response.asistencia;
        this.alumnoEncontrado = null;
        this.forzarActualizacionDOM();
        
        // ✅ MENSAJE ACTUALIZADO CON INFORMACIÓN DE ESTADO
        const estadoInfo = this.obtenerInfoEstado(response.asistencia?.estado_asistencia || '');
        
        this.mostrarError(
          'Registro Existente',
          `Este estudiante ya tiene asistencia registrada para ${fechaVerificar}:\n\n` +
          `• Hora: ${response.asistencia?.hora_de_llegada}\n` +
          `• Estado: ${estadoInfo.texto}\n` +
          `• Fecha: ${new Date(response.asistencia?.fecha || '').toLocaleDateString()}\n\n` +
          `${estadoInfo.accion}`
        );
        
        // Auto-limpiar después de mostrar error
        setTimeout(() => {
          this.buscarForm.patchValue({ codigo: '' });
          this.forzarActualizacionDOM();
        }, 3000);
        
      } else if (response?.tiene_asistencia === false && response?.alumno) {
        // 🚀 ACTUALIZACIÓN INMEDIATA DEL DOM - PRIMERO
        this.tieneAsistencia = false;
        this.asistenciaExistente = null;
        this.alumnoEncontrado = response.alumno;
        
        this.registroForm.patchValue({
          id_alumno: response.alumno?.id_alumno
        });
        
        // FORZAR ACTUALIZACIÓN INMEDIATA
        this.forzarActualizacionDOM();
        
        console.log('✅ Alumno listo para registro - DOM actualizado:', this.alumnoEncontrado);
        
        // DESPUÉS mostrar SweetAlert SIN BLOQUEAR
        const nombreCompleto = `${response.alumno?.nombre} ${response.alumno?.apellido}`;
        const turnoInfo = response.alumno?.turno ? 
          `${response.alumno.turno.turno} (${response.alumno.turno.hora_inicio} - ${response.alumno.turno.hora_fin})` : 
          'Sin turno';
        
        const fechaTexto = fechaVerificar === this.fechaHoy ? 'hoy' : fechaVerificar;
        
        // SIN AWAIT para no bloquear
        Swal.fire({
          icon: 'success',
          title: '¡Estudiante Encontrado!',
          html: `
            <div style="text-align: left; font-size: 14px;">
              <p><strong>👤 Nombre:</strong> ${nombreCompleto}</p>
              <p><strong>📝 Código:</strong> ${response.alumno?.codigo}</p>
              <p><strong>🕐 Turno:</strong> ${turnoInfo}</p>
              <p><strong>📅 Fecha:</strong> ${fechaTexto}</p>
              <p><strong>✅ Estado:</strong> Sin asistencia registrada</p>
            </div>
          `,
          confirmButtonText: 'Continuar',
          confirmButtonColor: '#2563eb',
          timer: 4000,
          timerProgressBar: true,
          toast: true,
          position: 'top-end',
          showConfirmButton: false
        });
        
      } else {
        this.limpiarEstadosAnteriores();
        this.forzarActualizacionDOM();
        await this.mostrarError(
          'Respuesta Inesperada',
          'El servidor devolvió una respuesta que no se puede procesar. Intente nuevamente.'
        );
      }
      
    } catch (error: any) {
      console.error('💥 Error:', error);
      this.limpiarEstadosAnteriores();
      this.forzarActualizacionDOM();
      await this.manejarErrorVerificacion(error, codigo);
    } finally {
      this.verificando = false;
      this.forzarActualizacionDOM();
    }
  }

  // ✨ FUNCIÓN PARA OBTENER INFORMACIÓN DEL ESTADO
  private obtenerInfoEstado(estado: string): {texto: string, accion: string} {
    switch (estado) {
      case 'PUNTUAL':
        return {
          texto: 'PUNTUAL ✅',
          accion: 'La asistencia está correctamente registrada.'
        };
      case 'TARDANZA':
        return {
          texto: 'TARDANZA ⚠️',
          accion: 'La asistencia está registrada con tardanza.'
        };
      case 'ANULADO':
        return {
          texto: 'ANULADO ❌',
          accion: 'Use la interfaz de actualización para corregir registros anulados.'
        };
      case 'JUSTIFICADO':
        return {
          texto: 'JUSTIFICADO 📝',
          accion: 'Use la interfaz de justificaciones para modificar.'
        };
      case 'AUSENTE':
        return {
          texto: 'AUSENTE ❌',
          accion: 'Use la interfaz correspondiente para modificar ausencias.'
        };
      default:
        return {
          texto: estado,
          accion: 'Use la interfaz correspondiente para modificar este registro.'
        };
    }
  }
  
  async registrarAsistencia(): Promise<void> {
    if (!this.puedeRegistrar) {
      await this.mostrarError(
        'Registro No Permitido',
        'Debe buscar un estudiante válido que no tenga asistencia registrada.'
      );
      return;
    }
    
    if (this.registroForm.invalid) {
      await this.mostrarError(
        'Formulario Incompleto',
        'Hay campos obligatorios sin completar o con errores.\n\n' +
        this.obtenerDetallesErroresFormulario()
      );
      this.marcarCamposComoTocados();
      return;
    }
    
    this.registrando = true;
    this.forzarActualizacionDOM();
    
    const datosRegistro = this.construirDatosRegistro();
    
    try {
      console.log('📤 Enviando registro:', datosRegistro);
      
      const response = await this.http.post<RegistroAsistenciaResponse>(
        `${this.baseUrl}/manual`,
        datosRegistro
      ).toPromise();
      
      console.log('✅ Registro exitoso:', response);
      
      await this.manejarRegistroExitoso(response, datosRegistro);
      
    } catch (error: any) {
      console.error('💥 Error al registrar:', error);
      await this.manejarErrorRegistro(error, datosRegistro);
    } finally {
      this.registrando = false;
      this.forzarActualizacionDOM();
    }
  }
  
  // ✅ FUNCIÓN ACTUALIZADA PARA INCLUIR FECHA
  private construirDatosRegistro(): RegistroAsistenciaRequest {
    const datos: RegistroAsistenciaRequest = {
      id_alumno: this.registroForm.get('id_alumno')?.value,
      hora_de_llegada: this.registroForm.get('hora_de_llegada')?.value,
      hora_salida: this.registroForm.get('hora_salida')?.value || undefined,
      estado_asistencia: this.registroForm.get('estado_asistencia')?.value,
      motivo: this.registroForm.get('motivo')?.value,
      id_auxiliar: this.registroForm.get('id_auxiliar')?.value
    };

    // ✨ INCLUIR FECHA SOLO SI NO ES HOY
    const fechaSeleccionada = this.registroForm.get('fecha')?.value;
    if (fechaSeleccionada && fechaSeleccionada !== this.fechaHoy) {
      datos.fecha = fechaSeleccionada;
    }

    return datos;
  }
  
  private async manejarRegistroExitoso(response: any, datosRegistro: RegistroAsistenciaRequest): Promise<void> {
    const nombreCompleto = `${this.alumnoEncontrado?.nombre} ${this.alumnoEncontrado?.apellido}`;
    const horaActual = new Date().toLocaleTimeString();
    const fechaRegistro = datosRegistro.fecha || this.fechaHoy;
    const fechaTexto = fechaRegistro === this.fechaHoy ? 'hoy' : fechaRegistro;
    const idRegistro = response?.asistencia?.id_asistencia || 'N/A';
    
    await Swal.fire({
      icon: 'success',
      title: '🎉 ¡Registro Completado!',
      html: `
        <div style="text-align: left; font-size: 14px;">
          <h4 style="color: #059669; margin-bottom: 10px;">✅ Confirmación del Registro</h4>
          <p><strong>👤 Estudiante:</strong> ${nombreCompleto}</p>
          <p><strong>📝 Código:</strong> ${this.alumnoEncontrado?.codigo}</p>
          <p><strong>🕐 Hora llegada:</strong> ${datosRegistro.hora_de_llegada}</p>
          ${datosRegistro.hora_salida ? `<p><strong>🕐 Hora salida:</strong> ${datosRegistro.hora_salida}</p>` : ''}
          <p><strong>📊 Estado:</strong> ${datosRegistro.estado_asistencia}</p>
          <p><strong>📅 Fecha registro:</strong> ${fechaTexto}</p>
          <p><strong>⏰ Procesado:</strong> ${horaActual}</p>
          <p><strong>🆔 ID:</strong> ${idRegistro}</p>
        </div>
      `,
      confirmButtonText: 'Nuevo Registro',
      confirmButtonColor: '#2563eb',
      timer: 8000,
      timerProgressBar: true
    });
    
    this.resetearTodo();
  }
  
  // ✅ ACTUALIZADO PARA MANEJAR NUEVOS ERRORES
  private async manejarErrorRegistro(error: any, datosRegistro: RegistroAsistenciaRequest): Promise<void> {
    const nombreCompleto = `${this.alumnoEncontrado?.nombre} ${this.alumnoEncontrado?.apellido}`;
    
    let titulo = 'Error al Registrar';
    let mensaje = '';
    
    if (error.status === 400) {
      if (error.error?.message?.includes('ya tiene asistencia registrada')) {
        titulo = 'Asistencia Duplicada';
        mensaje = `El estudiante ${nombreCompleto} ya tiene asistencia registrada para la fecha seleccionada.\n\nPosible registro simultáneo por otro auxiliar o por scanner.`;
      } else if (error.error?.message?.includes('Use la interfaz correspondiente')) {
        titulo = 'Registro Existente';
        mensaje = error.error.message + '\n\n• Para ANULADOS: Use interfaz de actualización\n• Para AUSENTES: Use interfaz de ausencias\n• Para JUSTIFICADOS: Use interfaz de justificaciones';
      } else if (error.error?.message?.includes('hora')) {
        titulo = 'Error en Horarios';
        mensaje = `Las horas ingresadas no son válidas:\n\n• Llegada: ${datosRegistro.hora_de_llegada}\n• Salida: ${datosRegistro.hora_salida || 'No especificada'}\n\nVerifique que estén dentro del turno del estudiante.`;
      } else if (error.error?.message?.includes('debe ser PUNTUAL o TARDANZA')) {
        titulo = 'Estado Inválido';
        mensaje = 'Solo se permiten los estados PUNTUAL y TARDANZA para registro manual.\n\nLos demás estados se manejan en interfaces específicas.';
      } else {
        titulo = 'Datos Inválidos';
        mensaje = error.error?.message || 'Los datos enviados no cumplen las validaciones del servidor.';
      }
    } else if (error.status === 404) {
      titulo = 'Estudiante No Encontrado';
      mensaje = `El estudiante ${nombreCompleto} no se encontró durante el registro.\n\nPosible eliminación después de la verificación.`;
    } else if (error.status === 500) {
      titulo = 'Error del Servidor';
      mensaje = 'Error interno del servidor al procesar el registro.\n\nEl equipo técnico ha sido notificado automáticamente.';
    } else if (error.status === 0) {
      titulo = 'Error de Conexión';
      mensaje = 'Se perdió la conexión durante el registro.\n\n⚠️ Verifique si el registro se completó antes de intentar nuevamente.';
    } else {
      titulo = 'Error Inesperado';
      mensaje = `Error ${error.status}: ${error.error?.message || error.message || 'Error desconocido'}`;
    }
    
    await this.mostrarError(titulo, mensaje);
  }
  
  private async manejarErrorVerificacion(error: any, codigo: string): Promise<void> {
    let titulo = 'Error de Verificación';
    let mensaje = '';
    
    if (error.status === 404) {
      titulo = 'Estudiante No Encontrado';
      mensaje = `No existe ningún estudiante con el código: ${codigo}\n\nVerifique que el código sea correcto.`;
    } else if (error.status === 0) {
      titulo = 'Error de Conexión';
      mensaje = 'No se puede conectar con el servidor.\n\nVerifique su conexión a internet.';
    } else if (error.status === 500) {
      titulo = 'Error del Servidor';
      mensaje = 'Error interno del servidor.\n\nIntente nuevamente en unos momentos.';
    } else {
      titulo = 'Error Inesperado';
      mensaje = `Error ${error.status}: ${error.error?.message || error.message || 'Error desconocido'}`;
    }
    
    await this.mostrarError(titulo, mensaje);
  }
  
  private obtenerDetallesErroresFormulario(): string {
    const errores: string[] = [];
    
    if (this.registroForm.get('hora_de_llegada')?.invalid) {
      errores.push('• Hora de llegada requerida');
    }
    if (this.registroForm.get('hora_salida')?.invalid) {
      errores.push('• Formato de hora de salida inválido');
    }
    if (this.registroForm.get('estado_asistencia')?.invalid) {
      errores.push('• Debe seleccionar PUNTUAL o TARDANZA');
    }
    if (this.registroForm.get('motivo')?.invalid) {
      const motivo = this.registroForm.get('motivo')?.value || '';
      if (motivo.length < 10) {
        errores.push(`• Motivo muy corto (${motivo.length}/10 caracteres)`);
      }
    }
    if (this.registroForm.get('fecha')?.invalid) {
      errores.push('• Fecha inválida');
    }
    
    return errores.join('\n');
  }
  
  private marcarCamposComoTocados(): void {
    Object.keys(this.registroForm.controls).forEach(key => {
      this.registroForm.get(key)?.markAsTouched();
      this.registroForm.get(key)?.markAsDirty();
    });
    this.forzarActualizacionDOM();
  }
  
  private validarHoraTiempoReal(hora: string, tipo: 'llegada' | 'salida'): void {
    if (!hora || !this.alumnoEncontrado?.turno) return;
    
    const turno = this.alumnoEncontrado.turno;
    const horaInicio = this.convertirHoraAMinutos(turno.hora_inicio);
    const horaFin = this.convertirHoraAMinutos(turno.hora_fin);
    const horaIngresada = this.convertirHoraAMinutos(hora);
    
    if (horaIngresada < horaInicio || horaIngresada > horaFin) {
      Swal.fire({
        icon: 'warning',
        title: 'Hora Fuera del Turno',
        text: `La hora de ${tipo} (${hora}) está fuera del horario del turno ${turno.turno} (${turno.hora_inicio} - ${turno.hora_fin}).`,
        confirmButtonColor: '#f59e0b',
        timer: 4000
      });
    }
    
    if (tipo === 'salida') {
      const horaLlegada = this.registroForm.get('hora_de_llegada')?.value;
      if (horaLlegada && horaIngresada <= this.convertirHoraAMinutos(horaLlegada)) {
        Swal.fire({
          icon: 'warning',
          title: 'Error en Secuencia',
          text: `La hora de salida (${hora}) debe ser posterior a la hora de llegada (${horaLlegada}).`,
          confirmButtonColor: '#f59e0b',
          timer: 4000
        });
      }
    }
  }
  
  private convertirHoraAMinutos(hora: string): number {
    const [horas, minutos] = hora.split(':').map(Number);
    return horas * 60 + minutos;
  }
  
  limpiarEstadosAnteriores(): void {
    this.alumnoEncontrado = null;
    this.tieneAsistencia = false;
    this.asistenciaExistente = null;
    this.limpiarTimeouts();
    console.log('🧹 Estados limpiados');
  }
  
  resetearTodo(): void {
    this.buscarForm.reset();
    this.registroForm.reset();
    this.registroForm.patchValue({
      estado_asistencia: 'PUNTUAL',
      id_auxiliar: this.ID_AUXILIAR_DEFAULT,
      fecha: this.fechaHoy // ✨ Resetear fecha a hoy
    });
    this.usarFechaPersonalizada = false; // ✨ Resetear flag de fecha personalizada
    this.limpiarEstadosAnteriores();
    this.forzarActualizacionDOM();
    
    console.log('🔄 Sistema reiniciado');
    
    setTimeout(() => {
      const codigoInput = document.getElementById('codigo');
      if (codigoInput) {
        codigoInput.focus();
      }
    }, 100);
  }
  
  buscarOtroAlumno(): void {
    this.buscarForm.reset();
    this.limpiarEstadosAnteriores();
    this.forzarActualizacionDOM();
    
    setTimeout(() => {
      const codigoInput = document.getElementById('codigo');
      if (codigoInput) {
        codigoInput.focus();
      }
    }, 100);
  }
  
  private limpiarTimeouts(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = null;
    }
  }
  
  // MÉTODOS PARA DOM INSTANTÁNEO
  private forzarActualizacionDOM(): void {
    this.cdr.detectChanges();
  }
  
  // MÉTODOS SWEETALERT
  private async mostrarError(titulo: string, mensaje: string): Promise<void> {
    await Swal.fire({
      icon: 'error',
      title: titulo,
      text: mensaje,
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#dc2626'
    });
  }
  
  private async mostrarExito(titulo: string, mensaje: string): Promise<void> {
    await Swal.fire({
      icon: 'success',
      title: titulo,
      text: mensaje,
      confirmButtonText: 'Continuar',
      confirmButtonColor: '#059669'
    });
  }
  
  private async mostrarAdvertencia(titulo: string, mensaje: string): Promise<void> {
    await Swal.fire({
      icon: 'warning',
      title: titulo,
      text: mensaje,
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#f59e0b'
    });
  }
  
  // GETTERS
  get puedeRegistrar(): boolean {
    return !this.tieneAsistencia && 
           this.alumnoEncontrado !== null && 
           !this.verificando && 
           !this.registrando;
  }
  
  get datosAlumnoValidos(): boolean {
    return this.alumnoEncontrado && 
           this.alumnoEncontrado.nombre && 
           this.alumnoEncontrado.apellido && 
           this.alumnoEncontrado.turno;
  }

  // ✨ NUEVOS GETTERS
  get fechaSeleccionada(): string {
    return this.registroForm.get('fecha')?.value || this.fechaHoy;
  }

  get esFechaHoy(): boolean {
    return this.fechaSeleccionada === this.fechaHoy;
  }

  get tipoRegistroTexto(): string {
    const tieneSalida = this.registroForm.get('hora_salida')?.value;
    return tieneSalida ? 'Registro completo (entrada + salida)' : 'Solo registro de entrada';
  }
}