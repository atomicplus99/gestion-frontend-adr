import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { v4 as uuidv4 } from 'uuid';
import { AlertsService } from '../../../../shared/alerts.service';
import { AlumnoService } from '../../../services/alumno.service';

@Component({
  selector: 'app-manual-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './manualRegister.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManualRegisterComponent {
  alumnoForm: FormGroup;
  turnos: { id_turno: string; turno: string; hora_inicio: string; hora_fin: string }[] = [];
  grados: string[] = [];
  secciones = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
  qrGenerado = '';

  constructor(
    private fb: FormBuilder,
    private alerts: AlertsService,
    private alumnoService: AlumnoService
  ) {
    this.alumnoForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      codigo: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      apellido: ['', [Validators.required, Validators.maxLength(100)]],
      fechaNacimiento: ['', [Validators.required, this.validarEdad()]],
      dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      direccion: ['', [Validators.required, Validators.maxLength(100)]],
      turno: ['', Validators.required],
      nivel: ['', Validators.required],
      grado: ['', Validators.required],
      seccion: ['', [Validators.required, Validators.pattern(/^[A-Z]$/)]],
    });

    this.alumnoForm.get('nivel')?.valueChanges.subscribe((nivel: string) => {
      this.grados = this.obtenerGradosPorNivel(nivel);
      this.alumnoForm.get('grado')?.setValue('');
    });

    this.obtenerTurnos();
  }

  obtenerTurnos() {
    this.alumnoService.obtenerTurnos().subscribe({
      next: (turnos) => {
        this.turnos = turnos;
      },
      error: () => {
        this.alerts.error('No se pudo cargar los turnos.');
      }
    });
  }

  obtenerGradosPorNivel(nivel: string): string[] {
    switch (nivel) {
      case 'Inicial': return ['1°', '2°', '3°'];
      case 'Primaria': return ['1°', '2°', '3°', '4°', '5°', '6°'];
      case 'Secundaria': return ['1°', '2°', '3°', '4°', '5°'];
      default: return [];
    }
  }

  generarQrUUID() {
    this.qrGenerado = uuidv4();
  }

  onSubmit() {
    if (this.alumnoForm.invalid || !this.qrGenerado) {
      this.alumnoForm.markAllAsTouched();
      this.alerts.error('Completa todos los campos correctamente y genera el código QR.');
      return;
    }
  
    const formValue = this.alumnoForm.value;
  
    const payload = {
      dni_alumno: formValue.dni,
      nombre: formValue.nombre,
      apellido: formValue.apellido,
      fecha_nacimiento: formValue.fechaNacimiento,
      direccion: formValue.direccion,
      codigo_qr: this.qrGenerado,
      codigo: formValue.codigo, // ✅ asegúrate de incluirlo
      turno_id: formValue.turno,
    
      nivel: formValue.nivel,
      grado: parseInt(formValue.grado),
      seccion: formValue.seccion,
    };
  
    this.alumnoService.registrarAlumno(payload).subscribe({
      next: () => {
        this.alerts.success('Alumno registrado correctamente');
        this.alumnoForm.reset();
        this.qrGenerado = '';
      },
      error: (err) => {
        console.error('Error detallado:', err);
        const msg = err?.error?.message || 'Error inesperado al registrar el alumno';
        const details = Array.isArray(msg) ? msg.join(', ') : msg;
        this.alerts.error(details);
      }
    });
  }

  getError(controlName: string): string {
    const control = this.alumnoForm.get(controlName);
    if (!control || !control.errors || !control.touched) return '';

    if (control.errors['required']) return 'Este campo es obligatorio.';
    if (control.errors['minlength']) return `Debe tener al menos ${control.errors['minlength'].requiredLength} caracteres.`;
    if (control.errors['maxlength']) return `No puede exceder ${control.errors['maxlength'].requiredLength} caracteres.`;
    if (control.errors['pattern']) return 'Formato inválido.';
    if (control.errors['edadInvalida']) return 'Edad inválida (debe tener entre 3 y 20 años).';

    return 'Campo inválido.';
  }

  validarEdad() {
    return (control: AbstractControl) => {
      const fecha = new Date(control.value);
      const hoy = new Date();

      if (isNaN(fecha.getTime())) return null;

      const edad = hoy.getFullYear() - fecha.getFullYear();
      const mes = hoy.getMonth() - fecha.getMonth();
      const dia = hoy.getDate() - fecha.getDate();
      const edadFinal = edad - (mes < 0 || (mes === 0 && dia < 0) ? 1 : 0);

      if (fecha > hoy || edadFinal < 3 || edadFinal > 20) {
        return { edadInvalida: true };
      }

      return null;
    };
  }
}
