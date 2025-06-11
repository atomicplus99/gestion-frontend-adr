import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PersonalInfoFormComponent } from '../personal-info-form/personal-info-form.component';
import { AcademicInfoFormComponent } from '../academic-info-form/academic-info-form.component';
import { QrGeneratorComponent } from '../qr-generator/qr-generator.component';
import { FormProgressComponent } from '../form-progress/form-progress.componen';
import { AlertsService } from '../../../../../../shared/alerts.service';
import { AlumnoService } from '../../../../../services/alumno.service';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  private qrService = inject(QrService);
  private cd = inject(ChangeDetectorRef);

  alumnoForm: FormGroup;
  turnos: Turno[] = [];
  qrGenerado = '';
  isSubmitting = false;

  constructor() {
    this.alumnoForm = this.createForm();
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
      fechaNacimiento: ['', [Validators.required, ValidationService.validarEdad()]],
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
    this.alumnoService.obtenerTurnos().subscribe({
      next: (turnos) => {
        this.turnos = turnos;
        this.cd.markForCheck();
      },
      error: () => {
        this.alerts.error('No se pudo cargar los turnos.');
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
    if (this.alumnoForm.invalid || !this.qrGenerado) {
      this.alumnoForm.markAllAsTouched();
      this.alerts.error('Completa todos los campos correctamente y genera el código QR.');
      this.scrollToFirstError();
      return;
    }
    
    this.isSubmitting = true;
    this.cd.markForCheck();
  
    const formValue = this.alumnoForm.value;
  
    const payload: RegistroAlumnoDto = {
      dni_alumno: formValue.dni,
      nombre: formValue.nombre,
      apellido: formValue.apellido,
      fecha_nacimiento: formValue.fechaNacimiento,
      direccion: formValue.direccion,
      codigo_qr: this.qrGenerado,
      codigo: formValue.codigo,
      turno_id: formValue.turno,
      nivel: formValue.nivel,
      grado: parseInt(formValue.grado),
      seccion: formValue.seccion,
    };
  
    this.alumnoService.registrarAlumno(payload).subscribe({
      next: () => {
        this.alerts.success('Alumno registrado correctamente');
        this.resetForm();
        this.isSubmitting = false;
        this.cd.markForCheck();
      },
      error: (err) => {
        console.error('Error detallado:', err);
        const msg = err?.error?.message || 'Error inesperado al registrar el alumno';
        const details = Array.isArray(msg) ? msg.join(', ') : msg;
        this.alerts.error(details);
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