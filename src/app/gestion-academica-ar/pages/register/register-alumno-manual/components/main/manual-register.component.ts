import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PersonalInfoFormComponent } from '../personal-info-form/personal-info-form.component';
import { AcademicInfoFormComponent } from '../academic-info-form/academic-info-form.component';
import { QrGeneratorComponent } from '../qr-generator/qr-generator.component';
import { FormProgressComponent } from '../form-progress/form-progress.componen';
import { AlertsService } from '../../../../../../shared/alerts.service';
import { AlumnoService } from '../../../../../services/alumno.service';
import { TurnoService } from '../../../../../services/turno.service';
import { QrService } from '../../services/qr.service';
import { FormProgress, RegistroAlumnoDto, Turno } from '../../interfaces/AlumnoRegister.interface';
import { ValidationService } from '../../services/validation.service';


@Component({
  selector: 'app-manual-register',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    PersonalInfoFormComponent,
    AcademicInfoFormComponent,
    QrGeneratorComponent,
    FormProgressComponent
  ],
  templateUrl: './manual-register.component.html',
  changeDetection: ChangeDetectionStrategy.Default,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
      animation: fadeIn 0.5s ease-out forwards;
    }
  `]
})
export class ManualRegisterAlumnoComponent implements OnInit {
  private fb = inject(FormBuilder);
  private alerts = inject(AlertsService);
  private alumnoService = inject(AlumnoService);
  private turnoService = inject(TurnoService);
  private qrService = inject(QrService);
  private cd = inject(ChangeDetectorRef);

  alumnoForm: FormGroup;
  turnos: Turno[] = [];
  qrGenerado = '';
  isSubmitting = false;

  constructor() {
    this.alumnoForm = this.createForm();
    // Asegurar que turnos siempre sea un array
    this.turnos = [];
  }

  ngOnInit() {
    this.obtenerTurnos();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      // Información personal
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      codigo: ['', [Validators.required, Validators.pattern(/^\d{14}$/)]],
      apellido: ['', [Validators.required, Validators.maxLength(100)]],
      fechaNacimiento: ['', [Validators.required]],
      dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      direccion: ['', [Validators.required, Validators.maxLength(100)]],
      
      // Información académica
      turno: ['', Validators.required],
      nivel: ['', Validators.required],
      grado: ['', Validators.required],
      seccion: ['', [Validators.required, Validators.pattern(/^[A-Z]$/)]],
    });
  }

  obtenerTurnos() {
    this.turnoService.obtenerTurnos().subscribe({
      next: (turnos) => {
        // Asegurar que turnos sea siempre un array
        if (Array.isArray(turnos)) {
          this.turnos = turnos;

        } else {
          console.warn('⚠️ [MANUAL-REGISTER] Respuesta inesperada, asignando array vacío');
          this.turnos = [];
        }
        this.cd.markForCheck();
      },
      error: (error) => {
        this.alerts.error('Error al cargar los turnos', 'Error de Carga');
        
        // En caso de error, asignar array vacío para evitar errores en el template
        this.turnos = [];
        
        // Mostrar mensaje específico según el tipo de error
        if (error?.status === 0) {
          this.alerts.error('No se puede conectar al servidor. Verifica tu conexión a internet.');
        } else if (error?.status === 401) {
          this.alerts.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        } else {
          this.alerts.error('No se pudo cargar los turnos. Inténtalo más tarde.');
        }
        
        this.cd.markForCheck();
      }
    });
  }

  onQrGenerado(qr: string) {
    this.qrGenerado = qr;
    this.cd.markForCheck();
  }

  getFormProgress(): FormProgress {
    if (!this.alumnoForm) {
      return { percent: 0, message: '0% completado', isComplete: false };
    }
    
    const controles = Object.keys(this.alumnoForm.controls);
    const completados = controles.filter(c => 
      this.alumnoForm.get(c)?.valid && this.alumnoForm.get(c)?.value
    );
    
    const percent = Math.round((completados.length / controles.length) * 100);
    
    if (percent === 100 && !this.qrGenerado) {
      return { 
        percent, 
        message: '<span class="text-yellow-500">Falta generar QR</span>',
        isComplete: false
      };
    } else if (percent === 100 && this.qrGenerado) {
      return { 
        percent, 
        message: '<span class="text-green-500">¡Listo para enviar!</span>',
        isComplete: true
      };
    } else {
      return { 
        percent, 
        message: `${percent}% completado`,
        isComplete: false
      };
    }
  }

  onSubmit() {
    if (!this.alumnoForm.valid || !this.qrGenerado) {
      this.alerts.error('Por favor completa todos los campos correctamente y genera el código QR.');
      return;
    }

    this.isSubmitting = true;
    this.cd.markForCheck();

    const formData = this.alumnoForm.value;
    
    // Mapear los datos del formulario a la interfaz esperada por el backend
    const payload: RegistroAlumnoDto = {
      dni_alumno: formData.dni,
      nombre: formData.nombre,
      apellido: formData.apellido,
      fecha_nacimiento: formData.fechaNacimiento,
      direccion: formData.direccion,
      codigo_qr: this.qrGenerado,
      codigo: formData.codigo,
      turno_id: formData.turno,
      nivel: formData.nivel,
      grado: parseInt(formData.grado),
      seccion: formData.seccion
    };



    this.alumnoService.registrarAlumno(payload).subscribe({
      next: async (response) => {
        this.alerts.success('Alumno registrado exitosamente');
        this.resetForm();
        this.isSubmitting = false;
        this.cd.markForCheck();
      },
      error: (err) => {
        this.alerts.error('Error del servidor al registrar alumno', 'Error de Registro');
        this.alerts.error('Error al registrar alumno: ' + (err?.error?.message || err?.message || 'Error desconocido'));
        this.isSubmitting = false;
        this.cd.markForCheck();
      },
      complete: () => {
        this.isSubmitting = false;
        this.cd.markForCheck();
      }
    });
  }

  private scrollToFirstError() {
    setTimeout(() => {
      const firstError = document.querySelector('.text-red-500');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }
  
  resetForm() {
    this.alumnoForm.reset();
    this.qrGenerado = '';
    this.cd.markForCheck();
  }
}