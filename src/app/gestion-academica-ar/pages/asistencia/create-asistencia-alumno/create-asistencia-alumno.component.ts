import { ChangeDetectionStrategy, ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import Swal from 'sweetalert2';
import { UserStoreService } from '../../../../auth/store/user.store';

@Component({
  selector: 'app-create-asistencia-alumno',
  standalone: true,
  templateUrl: './create-asistencia-alumno.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule,
    DatePipe,
  ],
})
export class CreateAsistenciaAlumnoComponent implements OnInit {
  buscarForm: FormGroup;
  asistenciaForm: FormGroup;
  alumnoEncontrado: any = null;
  loading = false;
  today = new Date();

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private userStore: UserStoreService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef
  ) {
    this.buscarForm = this.fb.group({
      codigo: ['', [Validators.required, Validators.minLength(10)]],
    });

    this.asistenciaForm = this.fb.group({
      hora_de_llegada: ['', Validators.required],
      hora_salida: [''],
      estado_asistencia: ['', Validators.required],
      motivo: ['', [Validators.required, Validators.maxLength(200)]],
    });
  }

  ngOnInit() {
    // Establecer la hora actual como valor predeterminado
    this.setCurrentTimeAsDefault();
  }

  setCurrentTimeAsDefault() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    this.asistenciaForm.get('hora_de_llegada')?.setValue(`${hours}:${minutes}`);
    this.cdr.markForCheck();
  }

  buscarAlumno() {
    if (this.buscarForm.invalid) return;
    const codigo = this.buscarForm.value.codigo.trim();
    if (!codigo) return;

    this.loading = true;
    this.cdr.markForCheck();

    this.http.get<any>(`http://localhost:3000/alumnos/codigo/${codigo}`).subscribe({
      next: (response) => {
        this.zone.run(() => {
          this.alumnoEncontrado = response;
          this.loading = false;
          
          // Establecer valores por defecto
          this.asistenciaForm.get('estado_asistencia')?.setValue('PUNTUAL');
          this.setCurrentTimeAsDefault();
          
          this.cdr.markForCheck();
          
          Swal.fire({
            title: 'Alumno encontrado',
            text: `Se ha encontrado a ${response.nombre} ${response.apellido}`,
            icon: 'success',
            confirmButtonText: 'Continuar',
            confirmButtonColor: '#2563eb'
          });
        });
      },
      error: (err) => {
        this.zone.run(() => {
          this.alumnoEncontrado = null;
          this.loading = false;
          this.cdr.markForCheck();
          
          let errorTitle = 'Error';
          let errorMessage = 'Hubo un problema al buscar el alumno.';
          
          if (err.status === 404) {
            errorTitle = 'No encontrado';
            errorMessage = 'No se encontró ningún alumno con ese código. Verifique e intente de nuevo.';
          } else if (err.status === 401) {
            errorTitle = 'No autorizado';
            errorMessage = 'No tienes permisos para acceder a esta información. Vuelve a iniciar sesión.';
          }
          
          Swal.fire({
            title: errorTitle,
            text: errorMessage,
            icon: 'error',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#2563eb'
          });
        });
      }
    });
  }

  registrarAsistencia() {
    if (this.asistenciaForm.invalid || !this.alumnoEncontrado) return;

    const payload = {
      id_alumno: this.alumnoEncontrado.id_alumno,
      hora_de_llegada: this.asistenciaForm.value.hora_de_llegada,
      hora_salida: this.asistenciaForm.value.hora_salida || null,
      estado_asistencia: this.asistenciaForm.value.estado_asistencia,
      motivo: this.asistenciaForm.value.motivo,
      id_auxiliar: this.userStore.user()?.idUser,
    };

    console.log('Datos de asistencia a registrar:', payload);

    this.http.post('http://localhost:3000/asistencia/manual', payload).subscribe({
      next: () => {
        Swal.fire({
          title: 'Registro exitoso',
          html: `
            <div class="text-center">
              <p>La asistencia se ha registrado correctamente para:</p>
              <p class="font-semibold mt-2">${this.alumnoEncontrado.nombre} ${this.alumnoEncontrado.apellido}</p>
              <div class="mt-3 inline-block bg-green-50 text-green-800 text-sm font-medium px-3 py-1 rounded-full border border-green-200">
                ${this.asistenciaForm.value.estado_asistencia}
              </div>
            </div>
          `,
          icon: 'success',
          confirmButtonText: 'Registrar otro',
          confirmButtonColor: '#2563eb'
        });
        
        this.cancelar();
      },
      error: (error) => {
        console.error('Error al registrar asistencia:', error);
  
        let errorMessage = 'Ocurrió un error inesperado al registrar la asistencia.';
  
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
  
        Swal.fire({
          title: 'Error al registrar',
          text: errorMessage,
          icon: 'error',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#2563eb'
        });
      }
    });
  }

  cancelar() {
    this.asistenciaForm.reset();
    this.buscarForm.reset();
    this.alumnoEncontrado = null;
    this.setCurrentTimeAsDefault();
    this.cdr.markForCheck();
  }
}