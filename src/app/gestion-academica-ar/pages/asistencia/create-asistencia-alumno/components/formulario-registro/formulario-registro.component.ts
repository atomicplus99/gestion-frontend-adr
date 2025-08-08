import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';

// Servicios
import { RegistroAsistenciaServiceManual } from '../../services/register-asistencia.service';
import { UserStoreService } from '../../../../../../auth/store/user.store';
import { FormValidationService } from '../../services/form-validation.service';
import { ErrorHandlerService } from '../../services/error-handler.service';
import { SuccessHandlerService } from '../../services/success-handler.service';




// Modelos
import { 
  AlumnoInfoAsistenciaManual, 
  ErrorResponseManualAsistencia, 
  RegistroAsistenciaRequestManual 
} from '../../models/CreateAsistenciaManual.model';
import { AuxiliarInfoComponent } from '../auxiliar-info/auxiliar-info.component';
import { FormStatusComponent } from '../form-status/form-status.component';
import { DateInfoComponent } from '../data-info/data-info.component';

@Component({
  selector: 'app-formulario-registro',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    AuxiliarInfoComponent,
    FormStatusComponent,
    DateInfoComponent
  ],
  templateUrl: './formulario-registro.component.html'
})
export class FormularioRegistroComponent implements OnInit, OnDestroy {
  registroForm!: FormGroup;
  registrando = false;
  alumnoEncontrado: AlumnoInfoAsistenciaManual | null = null;
  fechaSeleccionada: string = '';
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private registroService: RegistroAsistenciaServiceManual,
    private userStore: UserStoreService,
    private validationService: FormValidationService,
    private errorHandler: ErrorHandlerService,
    private successHandler: SuccessHandlerService,
    private cdr: ChangeDetectorRef
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.setupSubscriptions();
    this.setupInitialAuxiliarId();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========================================
  // MÉTODOS DE INICIALIZACIÓN
  // ========================================
  private initForm(): void {
    this.registroForm = this.fb.group({
      hora_de_llegada: ['', [
        Validators.required, 
        Validators.pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      ]],
      hora_salida: ['', [
        Validators.pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      ]],
      estado_asistencia: ['PUNTUAL', [
        Validators.required,
        Validators.pattern(/^(PUNTUAL|TARDANZA)$/)
      ]],
      motivo: ['', [
        Validators.required, 
        Validators.minLength(10),
        Validators.maxLength(500)
      ]],
      id_auxiliar: ['', [Validators.required]],
      id_alumno: ['']
    });
  }

  private setupSubscriptions(): void {
    // Suscripción a alumno encontrado
    this.registroService.alumnoEncontrado$
      .pipe(takeUntil(this.destroy$))
      .subscribe(alumno => {
        this.alumnoEncontrado = alumno;
        if (alumno) {
          this.registroForm.patchValue({ id_alumno: alumno.id_alumno });
        }
      });

    // Suscripción a fecha seleccionada
    this.registroService.fechaSeleccionada$
      .pipe(takeUntil(this.destroy$))
      .subscribe(fecha => {
        this.fechaSeleccionada = fecha;
      });

    // Validaciones en tiempo real
    this.setupRealTimeValidations();
  }

  private setupInitialAuxiliarId(): void {
    const idAuxiliar = this.userStore.idAuxiliar;
    if (idAuxiliar) {
      this.registroForm.patchValue({ id_auxiliar: idAuxiliar });
      console.log('✅ ID auxiliar establecido:', idAuxiliar);
    }
  }

  private setupRealTimeValidations(): void {
    this.registroForm.get('hora_de_llegada')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(hora => {
        if (hora && this.alumnoEncontrado?.turno) {
          this.validarHoraTiempoReal(hora, 'llegada');
        }
      });
    
    this.registroForm.get('hora_salida')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(hora => {
        if (hora && this.alumnoEncontrado?.turno) {
          this.validarHoraTiempoReal(hora, 'salida');
        }
      });
  }

  // ========================================
  // GETTERS
  // ========================================
  get puedeRegistrar(): boolean {
    return !!this.alumnoEncontrado && 
           !this.registroService.asistenciaActual && 
           !this.registrando &&
           !!this.idAuxiliarActual;
  }

  get esFechaHoy(): boolean {
    return this.registroService.esFechaHoy(this.fechaSeleccionada);
  }

  get tipoRegistroTexto(): string {
    const tieneSalida = this.registroForm.get('hora_salida')?.value;
    return tieneSalida ? 'Registro completo (entrada + salida)' : 'Solo registro de entrada';
  }

  get motivoLength(): number {
    return this.registroForm.get('motivo')?.value?.length || 0;
  }

  get idAuxiliarActual(): string | null {
    return this.userStore.idAuxiliar;
  }

  get nombreAuxiliarActual(): string {
    const user = this.userStore.user();
    if (user?.auxiliarInfo) {
      return `${user.auxiliarInfo.nombre} ${user.auxiliarInfo.apellido}`;
    }
    return 'Cargando...';
  }

  // ========================================
  // MÉTODOS DE VALIDACIÓN
  // ========================================
  getValidationClass(controlName: string, isOptional: boolean = false): string {
    return this.validationService.getValidationClass(
      this.registroForm.get(controlName), 
      isOptional
    );
  }

  getCharCountClass(): string {
    return this.validationService.getCharCountClass(this.motivoLength, 10);
  }

  getSubmitButtonClass(): string {
    return this.validationService.getSubmitButtonClass(
      this.registroForm.valid,
      this.registrando,
      !!this.idAuxiliarActual
    );
  }

  private validarHoraTiempoReal(hora: string, tipo: 'llegada' | 'salida'): void {
    if (!hora || !this.alumnoEncontrado?.turno) return;
    
    const turno = this.alumnoEncontrado.turno;
    const esHoraValida = this.registroService.validarHoraTurno(hora, turno.hora_inicio, turno.hora_fin);
    
    if (!esHoraValida) {
      Swal.fire({
        icon: 'warning',
        title: 'Hora Fuera del Turno',
        text: `La hora de ${tipo} (${hora}) está fuera del horario del turno ${turno.turno} (${turno.hora_inicio} - ${turno.hora_fin}).`,
        confirmButtonColor: '#f59e0b',
        timer: 4000
      });
    }
    
    if (tipo === 'salida') {
      this.validarSecuenciaHorarios(hora);
    }
  }

  private validarSecuenciaHorarios(horaSalida: string): void {
    const horaLlegada = this.registroForm.get('hora_de_llegada')?.value;
    if (!horaLlegada) return;

    const llegadaMinutos = this.registroService.convertirHoraAMinutos(horaLlegada);
    const salidaMinutos = this.registroService.convertirHoraAMinutos(horaSalida);
    
    if (salidaMinutos <= llegadaMinutos) {
      Swal.fire({
        icon: 'warning',
        title: 'Error en Secuencia',
        text: `La hora de salida (${horaSalida}) debe ser posterior a la hora de llegada (${horaLlegada}).`,
        confirmButtonColor: '#f59e0b',
        timer: 4000
      });
    }
  }

  // ========================================
  // MÉTODO PRINCIPAL DE REGISTRO
  // ========================================
  async registrarAsistencia(): Promise<void> {
    if (!this.validarPrerrequisitos()) return;
    if (!this.validarFormulario()) return;
    
    await this.procesarRegistro();
  }

  private validarPrerrequisitos(): boolean {
    if (!this.puedeRegistrar) {
      this.errorHandler.mostrarError(
        'Registro No Permitido',
        !this.idAuxiliarActual 
          ? 'No tiene permisos de auxiliar para registrar asistencia.'
          : 'Debe buscar un estudiante válido que no tenga asistencia registrada.'
      );
      return false;
    }
    return true;
  }

  private validarFormulario(): boolean {
    if (this.registroForm.invalid) {
      const errores = this.validationService.getFormErrors(this.registroForm, this.idAuxiliarActual);
      this.errorHandler.mostrarError(
        'Formulario Incompleto',
        'Hay campos obligatorios sin completar o con errores.\n\n' + errores.join('\n')
      );
      this.validationService.markAllFieldsAsTouched(this.registroForm);
      this.cdr.detectChanges();
      return false;
    }
    return true;
  }

  private async procesarRegistro(): Promise<void> {
    this.registrando = true;
    this.cdr.detectChanges();
    
    const datosRegistro = this.construirDatosRegistro();
    
    try {
      console.log('📤 Enviando registro:', datosRegistro);
      const response = await this.registroService.registrarAsistencia(datosRegistro).toPromise();
      console.log('✅ Registro exitoso:', response);
      
      await this.manejarRegistroExitoso(response, datosRegistro);
      
    } catch (error: any) {
      console.error('💥 Error al registrar:', error);
      await this.manejarErrorRegistro(error, datosRegistro);
    } finally {
      this.registrando = false;
      this.cdr.detectChanges();
    }
  }

  // ========================================
  // MÉTODOS DE CONSTRUCCIÓN Y MANEJO
  // ========================================
  private construirDatosRegistro(): RegistroAsistenciaRequestManual {
    const datos: RegistroAsistenciaRequestManual = {
      id_alumno: this.registroForm.get('id_alumno')?.value,
      hora_de_llegada: this.registroForm.get('hora_de_llegada')?.value,
      hora_salida: this.registroForm.get('hora_salida')?.value || undefined,
      estado_asistencia: this.registroForm.get('estado_asistencia')?.value,
      motivo: this.registroForm.get('motivo')?.value,
      id_auxiliar: this.registroForm.get('id_auxiliar')?.value
    };

    if (this.fechaSeleccionada && !this.registroService.esFechaHoy(this.fechaSeleccionada)) {
      datos.fecha = this.fechaSeleccionada;
    }

    return datos;
  }

  private async manejarRegistroExitoso(response: any, datosRegistro: RegistroAsistenciaRequestManual): Promise<void> {
    const nombreCompleto = `${this.alumnoEncontrado?.nombre} ${this.alumnoEncontrado?.apellido}`;
    
    await this.successHandler.mostrarRegistroExitoso(
      response,
      datosRegistro,
      nombreCompleto,
      this.alumnoEncontrado?.codigo || '',
      this.nombreAuxiliarActual,
      this.registroService.esFechaHoy.bind(this.registroService),
      this.registroService.getFechaHoy.bind(this.registroService)
    );
    
    this.resetearTodo();
  }

  private async manejarErrorRegistro(error: ErrorResponseManualAsistencia, datosRegistro: RegistroAsistenciaRequestManual): Promise<void> {
    const nombreCompleto = `${this.alumnoEncontrado?.nombre} ${this.alumnoEncontrado?.apellido}`;
    await this.errorHandler.manejarErrorRegistro(error, datosRegistro, nombreCompleto);
  }

  // ========================================
  // MÉTODO DE RESET
  // ========================================
  resetearTodo(): void {
    this.registroForm.reset();
    this.registroForm.patchValue({
      estado_asistencia: 'PUNTUAL',
      id_auxiliar: this.idAuxiliarActual
    });
    this.registroService.resetearTodo();
  }
}