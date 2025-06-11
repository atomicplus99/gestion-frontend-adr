// components/apoderado-search-and-edit.component.ts
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApoderadoService } from '../apoderado.service';
import { Apoderado, TipoRelacion, UpdateApoderadoDto } from '../models/ApoderadoDtos';


@Component({
  selector: 'app-apoderado-search-and-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './edit-apoderado.component.html'
})
export class ApoderadoSearchAndEditComponent {
  private apoderadoService = inject(ApoderadoService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  // Signals
  searching = signal(false);
  submitting = signal(false);
  searchExecuted = signal(false);
  searchResults = signal<Apoderado[]>([]);
  selectedApoderado = signal<Apoderado | null>(null);
  successMessage = signal('');
  errorMessage = signal('');

  // Campos de búsqueda
  searchDni = '';
  searchName = '';

  // Formulario de edición
  apoderadoForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(100)]],
    apellido: ['', [Validators.maxLength(100)]],
    dni: ['', [Validators.minLength(8), Validators.maxLength(8), Validators.pattern(/^\d{8}$/)]],
    email: ['', [Validators.email, Validators.maxLength(100)]],
    telefono: ['', [Validators.maxLength(15)]],
    tipo_relacion: ['', [Validators.required]],
    relacion_especifica: ['', [Validators.maxLength(100)]],
    activo: [true]
  });

  // Métodos de búsqueda
  searchApoderados(): void {
    if (!this.searchDni && !this.searchName) {
      return;
    }

    this.searching.set(true);
    this.clearMessages();
    this.searchExecuted.set(false);

    if (this.searchDni) {
      this.searchByDni();
    } else {
      this.searchByName();
    }
  }

  searchByDni(): void {
    this.apoderadoService.getByDni(this.searchDni).subscribe({
      next: (apoderado) => {
        this.searchResults.set(apoderado ? [apoderado] : []);
        this.searching.set(false);
        this.searchExecuted.set(true);
      },
      error: (error) => {
        console.error('Error searching by DNI:', error);
        this.searchResults.set([]);
        this.searching.set(false);
        this.searchExecuted.set(true);
        if (error.status === 404) {
          this.errorMessage.set('No se encontró ningún apoderado con ese DNI');
        } else {
          this.errorMessage.set('Error al buscar apoderado');
        }
      }
    });
  }

  searchByName(): void {
    this.apoderadoService.getAll().subscribe({
      next: (apoderados) => {
        const searchTerm = this.searchName.toLowerCase();
        const filtered = apoderados.filter(apoderado => 
          apoderado.nombre.toLowerCase().includes(searchTerm) ||
          (apoderado.apellido && apoderado.apellido.toLowerCase().includes(searchTerm))
        );
        
        this.searchResults.set(filtered);
        this.searching.set(false);
        this.searchExecuted.set(true);
      },
      error: (error) => {
        console.error('Error searching by name:', error);
        this.searchResults.set([]);
        this.searching.set(false);
        this.searchExecuted.set(true);
        this.errorMessage.set('Error al buscar apoderados');
      }
    });
  }

  // Selección de apoderado
  selectApoderado(apoderado: Apoderado): void {
    this.selectedApoderado.set(apoderado);
    this.loadApoderadoToForm(apoderado);
    this.clearMessages();
  }

  loadApoderadoToForm(apoderado: Apoderado): void {
    this.apoderadoForm.patchValue({
      nombre: apoderado.nombre,
      apellido: apoderado.apellido,
      dni: apoderado.dni,
      email: apoderado.email,
      telefono: apoderado.telefono,
      tipo_relacion: apoderado.tipo_relacion,
      relacion_especifica: apoderado.relacion_especifica,
      activo: apoderado.activo
    });
  }

  clearSelection(): void {
    this.selectedApoderado.set(null);
    this.apoderadoForm.reset();
    this.apoderadoForm.patchValue({ activo: true });
    this.clearMessages();
  }

  // Edición
  onSubmit(): void {
    if (this.apoderadoForm.valid && this.selectedApoderado()) {
      this.submitting.set(true);
      this.clearMessages();

      const formData = this.cleanFormData(this.apoderadoForm.value);
      this.updateApoderado(formData);
    } else {
      this.markFormGroupTouched();
    }
  }

  updateApoderado(data: UpdateApoderadoDto): void {
    const apoderadoId = this.selectedApoderado()!.id_apoderado;
    
    this.apoderadoService.update(apoderadoId, data).subscribe({
      next: (updatedApoderado) => {
        this.submitting.set(false);
        this.successMessage.set('Apoderado actualizado exitosamente');
        
        // Actualizar el apoderado seleccionado con los nuevos datos
        this.selectedApoderado.set(updatedApoderado);
        
        // Opcional: limpiar después de un tiempo
        setTimeout(() => {
          this.clearSelection();
        }, 3000);
      },
      error: (error) => {
        this.submitting.set(false);
        this.handleError(error);
      }
    });
  }

  // Utilidades
  formatRelation(tipo: TipoRelacion): string {
    const relations: Record<TipoRelacion, string> = {
      'PADRE': 'Padre',
      'MADRE': 'Madre',
      'ABUELO': 'Abuelo',
      'ABUELA': 'Abuela',
      'TIO': 'Tío',
      'TIA': 'Tía',
      'TUTOR': 'Tutor',
      'OTRO': 'Otro'
    };
    return relations[tipo] || tipo;
  }

  goBack(): void {
    this.router.navigate(['/apoderados']);
  }

  private cleanFormData(data: any): any {
    const cleanData: any = {};
    
    Object.keys(data).forEach(key => {
      const value = data[key];
      if (value !== null && value !== undefined && value !== '') {
        cleanData[key] = value;
      }
    });

    return cleanData;
  }

  private markFormGroupTouched(): void {
    Object.keys(this.apoderadoForm.controls).forEach(key => {
      const control = this.apoderadoForm.get(key);
      control?.markAsTouched();
    });
  }

  private clearMessages(): void {
    this.successMessage.set('');
    this.errorMessage.set('');
  }

  private handleError(error: any): void {
    console.error('Error:', error);
    
    if (error.status === 409) {
      this.errorMessage.set('Ya existe un apoderado con este DNI');
    } else if (error.status === 400) {
      this.errorMessage.set('Datos inválidos. Revise la información ingresada');
    } else if (error.status === 404) {
      this.errorMessage.set('Apoderado no encontrado');
    } else {
      this.errorMessage.set('Error al procesar la solicitud. Intente nuevamente');
    }
  }
}