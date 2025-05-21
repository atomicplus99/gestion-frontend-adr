// excel.component.ts
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { AlumnoModuleExcel, TurnoModuleExcel } from './models/RegisterAlumnoExcel.model';



@Component({
  selector: 'app-excel',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './excel.component.html',
  styleUrls: ['./excel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExcelComponent implements OnInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  private apiUrl = 'http://localhost:3000/alumnos';

  selectedFile: File | null = null;
  selectedTurnoId: string | null = null;
  turnos: TurnoModuleExcel[] = [];
  alumnos: AlumnoModuleExcel[] = [];
  isLoading = false;
  crearUsuarios = true;

  paginaActual = 1;
  itemsPorPagina = 10;
  Math = Math;

  ngOnInit(): void {
    this.cargarTurnos();
  }

  cargarTurnos(): void {
    this.isLoading = true;
    this.http.get<TurnoModuleExcel[]>('http://localhost:3000/turno').subscribe({
      next: (data) => {
        this.turnos = data;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar turnos:', error);
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron cargar los turnos.', confirmButtonColor: '#3085d6' });
      },
      complete: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.type === 'application/vnd.ms-excel') {
        this.selectedFile = file;
      } else {
        Swal.fire({ icon: 'error', title: 'Formato incorrecto', text: 'Selecciona un archivo Excel válido.', confirmButtonColor: '#3085d6' });
        this.selectedFile = null;
        input.value = '';
      }
      this.cdr.detectChanges();
    }
  }

  onImport(): void {
    if (!this.selectedFile || !this.selectedTurnoId) {
      Swal.fire({ icon: 'warning', title: 'Faltan datos', text: 'Selecciona archivo y turno.', confirmButtonColor: '#3085d6' });
      return;
    }

    this.isLoading = true;
    const formData = new FormData();
    formData.append('file', this.selectedFile);
    const url = `${this.apiUrl}/register-alumno-for-excel?turnoId=${this.selectedTurnoId}`;

    this.http.post<{ message: string, total: number, alumnos: AlumnoModuleExcel[] }>(url, formData).subscribe({
      next: (res) => {
        this.alumnos = res.alumnos || [];
        this.paginaActual = 1;
        Swal.fire({ icon: 'success', title: 'Importación exitosa', text: `Se importaron ${res.total} alumnos.`, confirmButtonColor: '#3085d6' });
        this.selectedFile = null;
        if (this.fileInputRef) {
          this.fileInputRef.nativeElement.value = '';
        }
      },
      error: (err) => {
        console.error('Error al importar:', err);
        const errorMsg = err?.error?.message || 'Hubo un problema al procesar el archivo.';
        Swal.fire({ icon: 'error', title: 'Error al importar', text: errorMsg, confirmButtonColor: '#d33' });
      },
      complete: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get totalPaginas(): number {
    return Math.ceil(this.alumnos.length / this.itemsPorPagina);
  }

  paginaAnterior(): void {
    if (this.paginaActual > 1) {
      this.paginaActual--;
      this.cdr.detectChanges();
    }
  }

  paginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas) {
      this.paginaActual++;
      this.cdr.detectChanges();
    }
  }

  irAPagina(pagina: number | string): void {
    if (typeof pagina === 'number' && pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
      this.cdr.detectChanges();
    }
  }

  cambiarItemsPorPagina(): void {
    this.paginaActual = 1;
    this.cdr.detectChanges();
  }

  obtenerPaginas(): (number | string)[] {
    const totalPag = this.totalPaginas;
    const paginaActual = this.paginaActual;
    const paginas: (number | string)[] = [];

    if (totalPag <= 7) {
      for (let i = 1; i <= totalPag; i++) {
        paginas.push(i);
      }
    } else {
      paginas.push(1);
      if (paginaActual > 3) {
        paginas.push('...');
      }
      let start = Math.max(2, paginaActual - 1);
      let end = Math.min(totalPag - 1, paginaActual + 1);
      if (paginaActual <= 3) {
        end = 4;
      }
      if (paginaActual >= totalPag - 2) {
        start = totalPag - 3;
      }
      for (let i = start; i <= end; i++) {
        paginas.push(i);
      }
      if (paginaActual < totalPag - 2) {
        paginas.push('...');
      }
      paginas.push(totalPag);
    }
    return paginas;
  }

  exportarExcel(): void {
    if (this.alumnos.length === 0) return;
    const data = this.alumnos.map(a => ({
      'Código': a.codigo,
      'DNI': a.dni_alumno,
      'Nombre': a.nombre,
      'Apellido': a.apellido,
      'Nivel': a.nivel,
      'Grado': a.grado,
      'Sección': a.seccion,
      'Fecha Nacimiento': new Date(a.fecha_nacimiento).toLocaleDateString(),
      'Usuario': a.usuario?.nombre_usuario || 'N/A',
      'Contraseña': a.usuario?.password_user || 'N/A'
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Alumnos');
    const fecha = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `alumnos_importados_${fecha}.xlsx`);
  }

  limpiarResultados(): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "Se borrarán los resultados de la importación de la tabla",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, limpiar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.alumnos = [];
        this.paginaActual = 1;
        this.cdr.detectChanges();
      }
    });
  }
}