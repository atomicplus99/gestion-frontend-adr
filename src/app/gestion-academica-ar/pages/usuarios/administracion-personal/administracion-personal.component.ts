import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { DirectorService } from '../services/director.service';
import { Director } from '../interfaces/director.interface';
import { DirectoresCrudComponent } from './components/directores-crud/directores-crud.component';
import { ErrorToastComponent } from '../../../../shared/components/error-toast/error-toast.component';

@Component({
  selector: 'app-administracion-personal',
  standalone: true,
  imports: [CommonModule, DirectoresCrudComponent, ErrorToastComponent],
  templateUrl: './administracion-personal.component.html',
  styleUrls: ['./administracion-personal.component.css']
})
export class AdministracionPersonalComponent implements OnInit, OnDestroy {
  private directorService = inject(DirectorService);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  // Estado
  loading = false;
  directores: Director[] = [];
  selectedTab = 'directores';
  
  // Mensajes
  successMessage = '';
  errorMessage = '';

  // Opciones de pestañas
  tabs = [
    { id: 'directores', label: 'Directores', icon: '👨‍💼' },
    { id: 'auxiliares', label: 'Auxiliares', icon: '👩‍💼', disabled: true },
    { id: 'administradores', label: 'Administradores', icon: '👨‍💻', disabled: true },
    { id: 'alumnos', label: 'Alumnos', icon: '👨‍🎓', disabled: true }
  ];

  ngOnInit(): void {
    this.cargarDirectores();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Cambiar pestaña activa
   */
  cambiarTab(tabId: string): void {
    if (this.tabs.find(tab => tab.id === tabId)?.disabled) {
      return;
    }
    
    this.selectedTab = tabId;
    this.clearMessages();
    
    if (tabId === 'directores') {
      this.cargarDirectores();
    }
  }

  /**
   * Cargar lista de directores
   */
  cargarDirectores(): void {
    this.loading = true;
    this.errorMessage = '';

    this.directorService.listarDirectores()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success && response.data) {
            this.directores = response.data;
          } else {
            this.directores = [];
          }
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = 'Error al cargar la lista de directores';
          this.directores = [];
          this.cdr.detectChanges();
          
          // Forzar detección de cambios adicional
          setTimeout(() => {
            this.cdr.detectChanges();
          }, 100);
        }
      });
  }

  /**
   * Manejar director creado
   */
  onDirectorCreado(): void {
    this.cargarDirectores();
    this.successMessage = 'Director creado exitosamente';
    this.cdr.detectChanges();
    
    setTimeout(() => {
      this.successMessage = '';
      this.cdr.detectChanges();
    }, 3000);
  }

  /**
   * Manejar director actualizado
   */
  onDirectorActualizado(): void {
    this.cargarDirectores();
    this.successMessage = 'Director actualizado exitosamente';
    this.cdr.detectChanges();
    
    setTimeout(() => {
      this.successMessage = '';
      this.cdr.detectChanges();
    }, 3000);
  }

  /**
   * Manejar director eliminado
   */
  onDirectorEliminado(): void {
    this.cargarDirectores();
    this.successMessage = 'Director eliminado exitosamente';
    this.cdr.detectChanges();
    
    setTimeout(() => {
      this.successMessage = '';
      this.cdr.detectChanges();
    }, 3000);
  }

  /**
   * Obtener clase CSS para pestaña
   */
  getTabClass(tabId: string, disabled: boolean): string {
    if (disabled) {
      return 'tab-disabled flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-all';
    }
    
    if (this.selectedTab === tabId) {
      return 'tab-active flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-all';
    }
    
    return 'tab-inactive flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-all';
  }

  /**
   * Limpiar mensajes
   */
  clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }
}
