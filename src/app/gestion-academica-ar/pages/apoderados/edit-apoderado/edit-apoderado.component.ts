// components/apoderado-search-and-edit.component.ts
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApoderadoService } from '../apoderado.service';
import { Apoderado, TipoRelacion, UpdateApoderadoDto, ApoderadoSearchResponseDto } from '../models/ApoderadoDtos';


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
  showSuccessMessage = signal(false);

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
    
    // ✅ Asegurar que searchResults siempre sea un array válido
    this.searchResults.set([]);

    if (this.searchDni) {
      this.searchByDni();
    } else {
      this.searchByName();
    }
  }

  searchByDni(): void {
    this.apoderadoService.getByDni(this.searchDni).subscribe({
      next: (response: ApoderadoSearchResponseDto) => {
        // ✅ Extraer el apoderado del campo 'data' de la respuesta del backend
        let apoderado: Apoderado | null = null;
        if (response && response.success && response.data) {
          apoderado = response.data;
        } else if (response && response.data) {
          // Fallback: si no hay 'success' pero sí 'data'
          apoderado = response.data;
        } else if (response && !response.success && !response.data) {
          // Si la respuesta es directamente el apoderado (formato antiguo)
          apoderado = response as any;
        }
        
        // ✅ Asegurar que siempre sea un array de Apoderado
        const results: Apoderado[] = apoderado ? [apoderado] : [];
        this.searchResults.set(results);
        this.searching.set(false);
        this.searchExecuted.set(true);
        
        // ✅ Debug: verificar qué se está estableciendo
        console.log('🔍 [EDIT-APODERADO] Búsqueda por DNI:', this.searchDni);
        console.log('🔍 [EDIT-APODERADO] Respuesta completa del backend:', response);
        console.log('🔍 [EDIT-APODERADO] Apoderado extraído:', apoderado);
        console.log('🔍 [EDIT-APODERADO] Resultados establecidos:', results);
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
        // ✅ Asegurar que apoderados sea siempre un array
        const apoderadosArray = Array.isArray(apoderados) ? apoderados : [];
        
        const searchTerm = this.searchName.toLowerCase();
        const filtered = apoderadosArray.filter(apoderado => 
          apoderado.nombre.toLowerCase().includes(searchTerm) ||
          (apoderado.apellido && apoderado.apellido.toLowerCase().includes(searchTerm))
        );
        
        this.searchResults.set(filtered);
        this.searching.set(false);
        this.searchExecuted.set(true);
        
        // ✅ Debug: verificar qué se está estableciendo
        console.log('🔍 [EDIT-APODERADO] Búsqueda por nombre:', this.searchName);
        console.log('🔍 [EDIT-APODERADO] Apoderados totales:', apoderadosArray.length);
        console.log('🔍 [EDIT-APODERADO] Resultados filtrados:', filtered.length);
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
    
    // ✅ Asegurar que searchResults siempre sea un array válido
    this.searchResults.set([]);
    
    // ✅ Mostrar mensaje informativo de que se puede buscar otro apoderado
    this.successMessage.set('Puedes buscar otro apoderado para editar');
    
    // ✅ Limpiar mensaje informativo después de 3 segundos
    setTimeout(() => {
      this.successMessage.set('');
    }, 3000);
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
      next: (response: any) => {
        this.submitting.set(false);
        
        // ✅ Usar el mensaje del backend si está disponible
        let successMsg = 'Apoderado actualizado exitosamente';
        let updatedApoderado = response;
        
        if (response && response.success && response.message) {
          successMsg = response.message;
        }
        
        if (response && response.data) {
          updatedApoderado = response.data;
        }
        
        // ✅ Agregar mensaje de que se cerrará la edición
        const fullMessage = `${successMsg} - La edición se cerrará automáticamente`;
        this.successMessage.set(fullMessage);
        
        // ✅ Debug: verificar la respuesta
        console.log('✅ [EDIT-APODERADO] Respuesta de actualización:', response);
        console.log('✅ [EDIT-APODERADO] Mensaje de éxito:', successMsg);
        
        // Actualizar el apoderado seleccionado con los nuevos datos
        this.selectedApoderado.set(updatedApoderado);
        
        // ✅ Mostrar mensaje de éxito prominente
        this.showSuccessMessage.set(true);
        
        // ✅ Cerrar edición inmediatamente después de mostrar el mensaje
        setTimeout(() => {
          this.clearSelection();
          this.showSuccessMessage.set(false);
        }, 1500); // Solo 1.5 segundos para cerrar rápido
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

  clearMessages(): void {
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