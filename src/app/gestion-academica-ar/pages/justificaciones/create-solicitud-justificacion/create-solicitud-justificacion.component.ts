import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { UserStoreService } from '../../../../auth/store/user.store';
import { Subject, takeUntil } from 'rxjs';
import { AlertsService } from '../../../../shared/alerts.service';

interface Alumno {
  id_alumno: string;
  codigo: string;
  dni_alumno: string;
  nombre: string;
  apellido: string;
  fecha_nacimiento: Date;
  direccion: string;
  codigo_qr: string;
  nivel: string;
  grado: number;
  seccion: string;
  turno?: any;
  usuario?: any;
}

interface CreateJustificacionDto {
  id_alumno: string;
  id_auxiliar?: string; // Para auxiliares
  id_usuario?: string; // Para administrador o director
  fecha_de_justificacion: string[];
  tipo_justificacion: 'MEDICA' | 'FAMILIAR' | 'ACADEMICA' | 'PERSONAL' | 'EMERGENCIA';
  motivo: string;
  documentos_adjuntos?: string[];
}

interface JustificacionResponse {
  statusCode: number;
  message: string;
  data: any;
}

@Component({
  selector: 'app-solicitud-justificacion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, HttpClientModule],
  templateUrl: './create-solicitud-justificacion.component.html',
  styleUrls: ['./create-solicitud-justificacion.component.css']
})
export class SolicitudJustificacionComponent implements OnInit {
  justificacionForm!: FormGroup;
  isLoading = false;
  isSearchingAlumno = false;
  
  alumnoEncontrado: Alumno | null = null;
  errorBusquedaAlumno: string = '';

  // Getters para acceder a los controles del formulario
  get usarRangoFechas(): boolean {
    return this.justificacionForm?.get('usar_rango_fechas')?.value || false;
  }

  set usarRangoFechas(value: boolean) {
    this.justificacionForm?.get('usar_rango_fechas')?.setValue(value);
    this.onTipoFechaChange();
  }

  get fechaInicio(): string {
    return this.justificacionForm?.get('fecha_inicio')?.value || '';
  }

  get fechaFin(): string {
    return this.justificacionForm?.get('fecha_fin')?.value || '';
  }

  // Subject para manejo de suscripciones
  private destroy$ = new Subject<void>();


  // Propiedades del usuario autenticado (auxiliar, administrador o director)
  get puedeCrearJustificaciones(): boolean {
    return this.userStore.canRegisterAttendance();
  }

  get idAuxiliarActual(): string | null {
    return this.userStore.idAuxiliar();
  }

  get idUsuarioActual(): string | null {
    const user = this.userStore.user();
    if (user?.administrador?.id_administrador) {
      return user.administrador.id_administrador;
    } else if (user?.director?.id_director) {
      return user.director.id_director;
    }
    return null;
  }

  get nombreUsuarioActual(): string | null {
    const user = this.userStore.user();
    if (user?.auxiliar) {
      return `${user.auxiliar.nombre} ${user.auxiliar.apellido}`;
    } else if (user?.username) {
      return user.username;
    } else if (user?.administrador) {
      return `${user.administrador.nombres} ${user.administrador.apellidos}`;
    } else if (user?.director) {
      return `${user.director.nombres} ${user.director.apellidos}`;
    }
    return null;
  }

  get rolUsuarioActual(): string | null {
    return this.userStore.userRole();
  }

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private userStore: UserStoreService,
    private alertsService: AlertsService
  ) {}

  ngOnInit() {
    this.initForm();
    this.verificarPermisosUsuario();
    this.setupUserSubscription();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========================================
  // MÉTODOS DE INICIALIZACIÓN Y PERMISOS
  // ========================================
  
  private verificarPermisosUsuario(): void {
    if (!this.puedeCrearJustificaciones) {
      this.alertsService.error('No tienes permisos para crear justificaciones.', 'Sin Permisos');
    }
  }

  private setupUserSubscription(): void {
    // Observar cambios en el usuario para mantener actualizado el ID del usuario
    // Si userStore.user() es un signal, no necesitas suscripción
    // Si es un observable, descomenta la línea siguiente:
    
    // this.userStore.user()
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe(user => {
    //     this.cdr.detectChanges();
    //   });
  }

  initForm() {
    this.justificacionForm = this.fb.group({
      codigo_alumno: ['', Validators.required],
      tipo_justificacion: ['', Validators.required],
      motivo: ['', Validators.required],
      fechas_justificacion: this.fb.array([this.fb.control('', Validators.required)]),
      documentos_adjuntos: this.fb.array([]),
      // Agregar campos para el rango de fechas
      usar_rango_fechas: [false],
      fecha_inicio: [''],
      fecha_fin: ['']
    });
  }

  get fechasArray() {
    return this.justificacionForm.get('fechas_justificacion') as FormArray;
  }

  get documentosArray() {
    return this.justificacionForm.get('documentos_adjuntos') as FormArray;
  }

  buscarAlumno() {
    const codigo = this.justificacionForm.get('codigo_alumno')?.value;
    if (!codigo) return;

    this.isSearchingAlumno = true;
    this.errorBusquedaAlumno = '';
    this.alumnoEncontrado = null;
    this.cdr.detectChanges();

    // Definir la interfaz de respuesta del backend
    interface BackendResponse<T> {
      success: boolean;
      message: string;
      timestamp: string;
      data: T;
    }

    this.http.get<BackendResponse<Alumno>>(`${environment.apiUrl}/alumnos/codigo/${codigo}`)
      .subscribe({
        next: (response) => {
          this.isSearchingAlumno = false;

          
          if (response && response.success && response.data) {
            this.alumnoEncontrado = response.data;
            this.errorBusquedaAlumno = '';
          } else {
            this.alumnoEncontrado = null;
            this.errorBusquedaAlumno = 'Respuesta del backend no válida';
          }
          
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.isSearchingAlumno = false;
          this.alumnoEncontrado = null;
          console.error('Error buscando alumno:', error);
          
          if (error.status === 404) {
            this.errorBusquedaAlumno = 'No se encontró un alumno con ese código';
          } else {
            this.errorBusquedaAlumno = 'Error al buscar el alumno. Intente nuevamente.';
          }
          this.cdr.detectChanges();
        }
      });
  }

  onTipoFechaChange() {
    const usandoRango = this.justificacionForm?.get('usar_rango_fechas')?.value || false;
    
    
    // Limpiar el array de fechas
    this.fechasArray.clear();
    
    if (usandoRango) {
      // Modo rango: limpiar fechas individuales y resetear rango
      this.justificacionForm.get('fecha_inicio')?.setValue('');
      this.justificacionForm.get('fecha_fin')?.setValue('');
      
    } else {
      // Modo individual: agregar un campo vacío
      this.fechasArray.push(this.fb.control('', Validators.required));
      
    }
    
    this.cdr.detectChanges();
  }

  generarRangoFechas() {
    const fechaInicio = this.justificacionForm.get('fecha_inicio')?.value;
    const fechaFin = this.justificacionForm.get('fecha_fin')?.value;
    
    
    
    if (!fechaInicio || !fechaFin) {
      
      return;
    }

    // Crear fechas sin problemas de zona horaria
    const inicio = new Date(fechaInicio + 'T12:00:00');
    const fin = new Date(fechaFin + 'T12:00:00');
    
    

    if (fin < inicio) {
      this.alertsService.error('La fecha de fin debe ser posterior a la fecha de inicio', 'Rango de Fechas Inválido');
      return;
    }

    // IMPORTANTE: Limpiar COMPLETAMENTE el FormArray
    while (this.fechasArray.length !== 0) {
      this.fechasArray.removeAt(0);
    }
    

    // Generar todas las fechas del rango
    const fechaActual = new Date(inicio);
    const fechasGeneradas: string[] = [];
    let contador = 0;
    
    while (fechaActual <= fin) {
      // Formatear fecha a YYYY-MM-DD
      const año = fechaActual.getFullYear();
      const mes = String(fechaActual.getMonth() + 1).padStart(2, '0');
      const dia = String(fechaActual.getDate()).padStart(2, '0');
      const fechaISO = `${año}-${mes}-${dia}`;
      
      
      
      // Agregar al FormArray
      this.fechasArray.push(this.fb.control(fechaISO, Validators.required));
      fechasGeneradas.push(fechaISO);
      contador++;
      
      // Avanzar al siguiente día
      fechaActual.setDate(fechaActual.getDate() + 1);
    }

    
    
    // Verificar que se agregaron correctamente
    if (this.fechasArray.length !== fechasGeneradas.length) {
      console.error('ERROR: El FormArray no coincide con las fechas generadas');
    } else {
      
    }
    
    

    this.cdr.detectChanges();
  }

  formatearFechaDisplay(fechaISO: string): string {
    if (!fechaISO) return '';
    const fecha = new Date(fechaISO + 'T12:00:00'); // Evitar problemas de zona horaria
    return fecha.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  validarRangoFechas(): boolean {
    const usandoRango = this.justificacionForm?.get('usar_rango_fechas')?.value || false;
    
    if (usandoRango) {
      // Modo rango: verificar que existan fecha inicio, fin y que se hayan generado fechas
      const fechaInicio = this.justificacionForm.get('fecha_inicio')?.value;
      const fechaFin = this.justificacionForm.get('fecha_fin')?.value;
      const tieneRango = !!(fechaInicio && fechaFin);
      const tieneFechasGeneradas = this.fechasArray.length > 0;
      

      
      
      return tieneRango && tieneFechasGeneradas;
    } else {
      // Modo individual: verificar que haya al menos una fecha no vacía
      const fechasValidas = this.fechasArray.value.filter((fecha: string) => fecha && fecha.trim());

      return fechasValidas.length > 0;
    }
  }

  agregarFecha() {
    this.fechasArray.push(this.fb.control('', Validators.required));
  }

  removerFecha(index: number) {
    if (this.fechasArray.length > 1) {
      this.fechasArray.removeAt(index);
    }
  }

  agregarDocumento() {
    this.documentosArray.push(this.fb.control(''));
  }

  removerDocumento(index: number) {
    this.documentosArray.removeAt(index);
  }

  onSubmit() {
    // Validar formulario básico
    if (!this.justificacionForm.valid || !this.alumnoEncontrado) {
      this.markFormGroupTouched();
      
      if (!this.alumnoEncontrado) {
        this.alertsService.error('Debe buscar y seleccionar un alumno válido', 'Alumno Requerido');
      }
      return;
    }

    // Validar fechas según el tipo seleccionado
    if (!this.validarRangoFechas()) {
      if (this.usarRangoFechas) {
        this.alertsService.error('Debe seleccionar fecha de inicio y fin válidas', 'Fechas Inválidas');
      } else {
        this.alertsService.error('Debe agregar al menos una fecha', 'Fechas Requeridas');
      }
      return;
    }

    this.isLoading = true;
    
    const formData = this.justificacionForm.value;
    
    // Obtener fechas según el modo seleccionado
    let fechasParaEnviar: string[];
    
    if (this.usarRangoFechas) {
      // Para rango, usar las fechas generadas automáticamente
      fechasParaEnviar = this.fechasArray.value
        .filter((fecha: string) => fecha)
        .map((fecha: string) => this.formatearFecha(fecha));
    } else {
      // Para fechas individuales, usar las fechas del formulario
      fechasParaEnviar = formData.fechas_justificacion
        .filter((fecha: string) => fecha)
        .map((fecha: string) => this.formatearFecha(fecha));
    }

    // Validar que hay fechas para enviar
    if (fechasParaEnviar.length === 0) {
      this.isLoading = false;
      this.alertsService.error('No hay fechas válidas para enviar', 'Fechas Requeridas');
      return;
    }
    
    // Filtrar documentos vacíos
    const documentosFiltrados = formData.documentos_adjuntos
      .filter((doc: string) => doc && doc.trim());

    // Verificar que el usuario esté autenticado y tenga un ID válido
    const tieneIdValido = this.idAuxiliarActual || this.idUsuarioActual;
    if (!tieneIdValido) {
      this.isLoading = false;
      this.alertsService.error('No se pudo obtener el ID del usuario. Verifica tu sesión y que tengas permisos.', 'Error de Autenticación');
      return;
    }

    // Construir payload según el rol del usuario
    const payload: CreateJustificacionDto = {
      id_alumno: this.alumnoEncontrado.id_alumno,
      fecha_de_justificacion: fechasParaEnviar,
      tipo_justificacion: formData.tipo_justificacion,
      motivo: formData.motivo,
      documentos_adjuntos: documentosFiltrados.length > 0 ? documentosFiltrados : undefined
    };

    // Asignar el ID correcto según el rol
    if (this.idAuxiliarActual) {
      payload.id_auxiliar = this.idAuxiliarActual;

    } else if (this.idUsuarioActual) {
      payload.id_usuario = this.idUsuarioActual;

    }











    this.http.post<JustificacionResponse>(`${environment.apiUrl}/detalle-justificaciones`, payload)
      .subscribe({
        next: (response) => {
          this.isLoading = false;

          
          // Mostrar mensaje de éxito personalizado
          this.alertsService.success(response.message || 'Solicitud de justificación registrada exitosamente', '¡Solicitud Registrada!');
          
          this.resetForm();
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.isLoading = false;
          console.error('❌ Error completo:', error);
          
          // Extraer mensaje específico del backend
          let mensajeError = 'Error al registrar la solicitud';
          
          if (error.error) {
            if (typeof error.error === 'string') {
              mensajeError = error.error;
            } else if (error.error.message) {
              mensajeError = error.error.message;
            } else if (error.error.error) {
              mensajeError = error.error.error;
            }
          } else if (error.message) {
            mensajeError = error.message;
          }
          
          // Mostrar error personalizado
          this.alertsService.error(mensajeError, 'Error al Registrar');
          
          this.cdr.detectChanges();
        }
      });
  }

  formatearFecha(fecha: string): string {
    // Convertir de YYYY-MM-DD a DD-MM-YYYY
    const partes = fecha.split('-');
    return `${partes[2]}-${partes[1]}-${partes[0]}`;
  }

  /**
   * Maneja la confirmación del mensaje de confirmación
   */

  markFormGroupTouched() {
    Object.keys(this.justificacionForm.controls).forEach(key => {
      const control = this.justificacionForm.get(key);
      control?.markAsTouched();
      
      if (control instanceof FormArray) {
        control.controls.forEach(c => c.markAsTouched());
      }
    });
  }

  resetForm() {

    
    this.justificacionForm.reset();
    this.fechasArray.clear();
    this.fechasArray.push(this.fb.control('', Validators.required));
    this.documentosArray.clear();
    this.alumnoEncontrado = null;
    this.errorBusquedaAlumno = '';
    
    // Reset propiedades de rango de fechas usando los form controls
    this.justificacionForm.get('usar_rango_fechas')?.setValue(false);
    this.justificacionForm.get('fecha_inicio')?.setValue('');
    this.justificacionForm.get('fecha_fin')?.setValue('');
    

    this.cdr.detectChanges();
  }

  cancelar() {
    this.resetForm();
  }
}