import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApoderadoAsignService } from '../asigne-alumno/services/apoderado-asigne.service';
import { Apoderado } from '../asigne-alumno/models/AsignarAlumnoApoderado.model';


@Component({
  selector: 'app-delete-apoderado',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './delete-apoderado.component.html'
})
export class DeleteApoderadoComponent implements OnInit {
  private apoderadoService = inject(ApoderadoAsignService);

  // Data Signals
  apoderados = signal<Apoderado[]>([]);
  apoderadoToDelete = signal<Apoderado | null>(null);
  isLoading = signal(false);
  showSuccessMessage = signal(false);
  errorMessage = signal('');

  // Filter Signals
  searchTerm = signal('');
  filterTipoRelacion = signal('');
  filterEstudiantesStatus = signal('');

  ngOnInit() {
    this.loadApoderados();
  }

  // Computed para apoderados filtrados
  filteredApoderados = computed(() => {
    let filtered = this.apoderados();

    // ✅ Validación de seguridad
    if (!filtered || !Array.isArray(filtered)) {
      
      return [];
    }

    // Search filter
    if (this.searchTerm()) {
      const term = this.searchTerm().toLowerCase();
      filtered = filtered.filter(apoderado => 
        apoderado.nombre.toLowerCase().includes(term) ||
        (apoderado.apellido && apoderado.apellido.toLowerCase().includes(term)) ||
        (apoderado.dni && apoderado.dni.toLowerCase().includes(term)) ||
        apoderado.tipo_relacion.toLowerCase().includes(term)
      );
    }

    // Tipo relación filter
    if (this.filterTipoRelacion()) {
      filtered = filtered.filter(apoderado => 
        apoderado.tipo_relacion === this.filterTipoRelacion()
      );
    }

    // Estudiantes status filter
    if (this.filterEstudiantesStatus() === 'con-estudiantes') {
      filtered = filtered.filter(apoderado => 
        apoderado.pupilos && apoderado.pupilos.length > 0
      );
    } else if (this.filterEstudiantesStatus() === 'sin-estudiantes') {
      filtered = filtered.filter(apoderado => 
        !apoderado.pupilos || apoderado.pupilos.length === 0
      );
    }

    // ✅ Validación adicional antes de ordenar
    if (!filtered || filtered.length === 0) {
      return [];
    }

    // Ordenar por nombre
    return filtered.sort((a, b) => a.nombre.localeCompare(b.nombre));
  });

  private async loadApoderados() {
    this.isLoading.set(true);
    try {
      const apoderados = await firstValueFrom(this.apoderadoService.getAllApoderados());
      this.apoderados.set(apoderados || []);
    } catch (error) {
      
      this.showError('Error al cargar los apoderados');
      this.apoderados.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  confirmDelete(apoderado: Apoderado) {
    this.apoderadoToDelete.set(apoderado);
  }

  cancelDelete() {
    this.apoderadoToDelete.set(null);
  }

  async executeDelete() {
    const apoderado = this.apoderadoToDelete();
    if (!apoderado) return;

    this.isLoading.set(true);
    try {
      // PASO 1: Si tiene estudiantes asignados, primero los desasignamos
      if (apoderado.pupilos && apoderado.pupilos.length > 0) {
        const estudiantesIds = apoderado.pupilos.map(pupilo => pupilo.id_alumno);
        
        // Remover todos los estudiantes del apoderado
        await firstValueFrom(this.apoderadoService.removeStudentsFromApoderado(
          apoderado.id_apoderado,
          { estudiante_ids: estudiantesIds }
        ));
      }

      // PASO 2: Ahora eliminar el apoderado (ya sin estudiantes asignados)
      await firstValueFrom(this.apoderadoService.deleteApoderado(apoderado.id_apoderado));

      this.showSuccess();
      this.apoderadoToDelete.set(null);
      
      // Recargar la lista
      await this.loadApoderados();

    } catch (error) {
      
      this.showError('Error al eliminar el apoderado. Intenta nuevamente.');
    } finally {
      this.isLoading.set(false);
    }
  }

  formatDate(date: Date): string {
    if (!date) return 'No disponible';
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  private showSuccess() {
    this.showSuccessMessage.set(true);
    setTimeout(() => this.showSuccessMessage.set(false), 3000);
  }

  private showError(message: string) {
    this.errorMessage.set(message);
    setTimeout(() => this.errorMessage.set(''), 3000);
  }
}