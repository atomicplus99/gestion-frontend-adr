import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

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
  id_auxiliar: string;
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
  showAlert = false;
  alertType: 'success' | 'error' = 'success';
  alertMessage = '';
  
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

  // ID del auxiliar autenticado - CAMBIAR POR EL VALOR REAL
  private readonly ID_AUXILIAR_AUTENTICADO = '37419ff9-9ce8-4b1a-bdc6-2ed28ae8cc0b';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.initForm();
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

    this.http.get<Alumno>(`http://localhost:3000/alumnos/codigo/${codigo}`)
      .subscribe({
        next: (alumno) => {
          this.isSearchingAlumno = false;
          this.alumnoEncontrado = alumno;
          this.cdr.detectChanges();
          console.log('Alumno encontrado:', alumno);
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
    console.log('Cambio de tipo de fecha a:', usandoRango ? 'Rango' : 'Individual');
    
    // Limpiar el array de fechas
    this.fechasArray.clear();
    
    if (usandoRango) {
      // Modo rango: limpiar fechas individuales y resetear rango
      this.justificacionForm.get('fecha_inicio')?.setValue('');
      this.justificacionForm.get('fecha_fin')?.setValue('');
      console.log('Modo rango activado - campos reseteados');
    } else {
      // Modo individual: agregar un campo vacío
      this.fechasArray.push(this.fb.control('', Validators.required));
      console.log('Modo individual activado - campo agregado');
    }
    
    this.cdr.detectChanges();
  }

  generarRangoFechas() {
    const fechaInicio = this.justificacionForm.get('fecha_inicio')?.value;
    const fechaFin = this.justificacionForm.get('fecha_fin')?.value;
    
    console.log('=== GENERANDO RANGO DE FECHAS ===');
    console.log('Fecha inicio:', fechaInicio);
    console.log('Fecha fin:', fechaFin);
    
    if (!fechaInicio || !fechaFin) {
      console.log('Faltan fechas, saliendo...');
      return;
    }

    // Crear fechas sin problemas de zona horaria
    const inicio = new Date(fechaInicio + 'T12:00:00');
    const fin = new Date(fechaFin + 'T12:00:00');
    
    console.log('Fecha inicio procesada:', inicio);
    console.log('Fecha fin procesada:', fin);

    if (fin < inicio) {
      this.showAlertMessage('La fecha de fin debe ser posterior a la fecha de inicio', 'error');
      return;
    }

    // IMPORTANTE: Limpiar COMPLETAMENTE el FormArray
    while (this.fechasArray.length !== 0) {
      this.fechasArray.removeAt(0);
    }
    console.log('FormArray limpiado completamente');

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
      
      console.log(`Día ${contador + 1}: Generando fecha:`, fechaISO);
      
      // Agregar al FormArray
      this.fechasArray.push(this.fb.control(fechaISO, Validators.required));
      fechasGeneradas.push(fechaISO);
      contador++;
      
      // Avanzar al siguiente día
      fechaActual.setDate(fechaActual.getDate() + 1);
    }

    console.log('=== RESUMEN GENERACIÓN ===');
    console.log('Fechas generadas (ISO):', fechasGeneradas);
    console.log('FormArray.value:', this.fechasArray.value);
    console.log('FormArray.length:', this.fechasArray.length);
    console.log('Total de fechas generadas:', contador);
    
    // Verificar que se agregaron correctamente
    if (this.fechasArray.length !== fechasGeneradas.length) {
      console.error('ERROR: El FormArray no coincide con las fechas generadas');
    } else {
      console.log('✅ FormArray generado correctamente');
    }
    
    console.log('=== FIN GENERACIÓN DE RANGO ===');

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
      
      console.log('Validación rango - Tiene rango:', tieneRango);
      console.log('Validación rango - Fechas generadas:', tieneFechasGeneradas, 'Cantidad:', this.fechasArray.length);
      
      return tieneRango && tieneFechasGeneradas;
    } else {
      // Modo individual: verificar que haya al menos una fecha no vacía
      const fechasValidas = this.fechasArray.value.filter((fecha: string) => fecha && fecha.trim());
      console.log('Validación individual - Fechas válidas:', fechasValidas.length);
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
        this.showAlertMessage('Debe buscar y seleccionar un alumno válido', 'error');
      }
      return;
    }

    // Validar fechas según el tipo seleccionado
    if (!this.validarRangoFechas()) {
      if (this.usarRangoFechas) {
        this.showAlertMessage('Debe seleccionar fecha de inicio y fin válidas', 'error');
      } else {
        this.showAlertMessage('Debe agregar al menos una fecha', 'error');
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
      this.showAlertMessage('No hay fechas válidas para enviar', 'error');
      return;
    }
    
    // Filtrar documentos vacíos
    const documentosFiltrados = formData.documentos_adjuntos
      .filter((doc: string) => doc && doc.trim());

    const payload: CreateJustificacionDto = {
      id_alumno: this.alumnoEncontrado.id_alumno,
      id_auxiliar: this.ID_AUXILIAR_AUTENTICADO,
      fecha_de_justificacion: fechasParaEnviar,
      tipo_justificacion: formData.tipo_justificacion,
      motivo: formData.motivo,
      documentos_adjuntos: documentosFiltrados.length > 0 ? documentosFiltrados : undefined
    };

    console.log('Payload a enviar:', payload);

    this.http.post<JustificacionResponse>('http://localhost:3000/detalle-justificaciones', payload)
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          
          // Mostrar mensaje de éxito del backend o uno por defecto
          const mensaje = response.message || 'Solicitud registrada exitosamente';
          this.showAlertMessage(mensaje, 'success');
          
          this.resetForm();
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error completo:', error);
          
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
          
          this.showAlertMessage(mensajeError, 'error');
          this.cdr.detectChanges();
        }
      });
  }

  formatearFecha(fecha: string): string {
    // Convertir de YYYY-MM-DD a DD-MM-YYYY
    const partes = fecha.split('-');
    return `${partes[2]}-${partes[1]}-${partes[0]}`;
  }

  showAlertMessage(message: string, type: 'success' | 'error') {
    this.alertMessage = message;
    this.alertType = type;
    this.showAlert = true;
    this.cdr.detectChanges();
    
    setTimeout(() => {
      this.showAlert = false;
      this.cdr.detectChanges();
    }, 5000);
  }

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
    console.log('=== RESET FORMULARIO ===');
    
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
    
    console.log('Formulario reseteado - Modo individual activado');
    this.cdr.detectChanges();
  }

  cancelar() {
    this.resetForm();
  }
}