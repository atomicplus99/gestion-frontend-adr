import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-excel',
  imports: [FormsModule, CommonModule],
  templateUrl: './excel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExcelComponent {

  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  selectedFile: File | null = null;
  alumnos: any[] = [];

  paginaActual = 1;
  itemsPorPagina = 10;

  get totalPaginas(): number {
    return Math.ceil(this.alumnos.length / this.itemsPorPagina);
  }

  paginaAnterior(): void {
    if (this.paginaActual > 1) {
      this.paginaActual--;
    }
  }

  paginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas) {
      this.paginaActual++;
    }
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  onImport(): void {
    if (!this.selectedFile) return;

    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.http.post<any>('http://localhost:3000/alumno/import-excel', formData).subscribe({
      next: (res) => {
        this.alumnos = res.alumnos || [];
    
        Swal.fire({
          icon: 'success',
          title: 'Importación exitosa',
          text: `Se importaron ${res.total} alumnos.`,
          confirmButtonColor: '#3085d6'
        });
    
        this.selectedFile = null;
        this.fileInputRef.nativeElement.value = '';
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
    
        const errorMsg = err?.error?.message || 'Hubo un problema al procesar el archivo.';
    
        Swal.fire({
          icon: 'error',
          title: 'Error al importar',
          text: errorMsg,
          confirmButtonColor: '#d33'
        });
      }
    });
  }
}
