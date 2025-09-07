import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { DirectorService } from '../services/director.service';
import { AdministradorService } from '../services/administrador.service';
import { AuxiliarService } from '../services/auxiliar.service';
import { AlumnoService } from '../services/alumno.service';
import { Director } from '../interfaces/director.interface';
import { Administrador } from '../interfaces/administrador.interface';
import { Auxiliar } from '../interfaces/auxiliar.interface';
import { Alumno, Turno } from '../interfaces/alumno.interface';
import { DirectoresCrudComponent } from './components/directores-crud/directores-crud.component';
import { AdministradoresCrudComponent } from './components/administradores-crud/administradores-crud.component';
import { AuxiliaresCrudComponent } from './components/auxiliares-crud/auxiliares-crud.component';
import { AlumnosCrudComponent } from './components/alumnos-crud/alumnos-crud.component';
import { ErrorToastComponent } from '../../../../shared/components/error-toast/error-toast.component';

@Component({
  selector: 'app-administracion-personal',
  standalone: true,
  imports: [CommonModule, DirectoresCrudComponent, AdministradoresCrudComponent, AuxiliaresCrudComponent, AlumnosCrudComponent, ErrorToastComponent],
  templateUrl: './administracion-personal.component.html',
  styleUrls: ['./administracion-personal.component.css']
})
export class AdministracionPersonalComponent implements OnInit, OnDestroy {
  private directorService = inject(DirectorService);
  private administradorService = inject(AdministradorService);
  private auxiliarService = inject(AuxiliarService);
  private alumnoService = inject(AlumnoService);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  // Estado
  loading = false;
  directores: Director[] = [];
  administradores: Administrador[] = [];
  auxiliares: Auxiliar[] = [];
  alumnos: Alumno[] = [];
  turnos: Turno[] = [];
  selectedTab = 'directores';
  
  // Mensajes
  successMessage = '';
  errorMessage = '';

  // Opciones de pestañas
  tabs = [
    { id: 'directores', label: 'Directores', icon: '👨‍💼' },
    { id: 'auxiliares', label: 'Auxiliares', icon: '👩‍💼' },
    { id: 'administradores', label: 'Administradores', icon: '👨‍💻' },
    { id: 'alumnos', label: 'Alumnos', icon: '👨‍🎓' }
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
    this.selectedTab = tabId;
    this.clearMessages();
    
    switch (tabId) {
      case 'directores':
        this.cargarDirectores();
        break;
      case 'administradores':
        this.cargarAdministradores();
        break;
      case 'auxiliares':
        this.cargarAuxiliares();
        break;
      case 'alumnos':
        this.cargarAlumnos();
        break;
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

  // ==================== MÉTODOS PARA ADMINISTRADORES ====================

  /**
   * Cargar lista de administradores
   */
  cargarAdministradores(): void {
    this.loading = true;
    this.errorMessage = '';

    this.administradorService.listarAdministradores()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success && response.data) {
            this.administradores = response.data;
          } else {
            this.administradores = [];
          }
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = 'Error al cargar la lista de administradores';
          this.administradores = [];
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Manejar administrador creado
   */
  onAdministradorCreado(): void {
    this.cargarAdministradores();
    this.successMessage = 'Administrador creado exitosamente';
    this.cdr.detectChanges();
    
    setTimeout(() => {
      this.successMessage = '';
      this.cdr.detectChanges();
    }, 3000);
  }

  /**
   * Manejar administrador actualizado
   */
  onAdministradorActualizado(): void {
    this.cargarAdministradores();
    this.successMessage = 'Administrador actualizado exitosamente';
    this.cdr.detectChanges();
    
    setTimeout(() => {
      this.successMessage = '';
      this.cdr.detectChanges();
    }, 3000);
  }

  /**
   * Manejar administrador eliminado
   */
  onAdministradorEliminado(): void {
    this.cargarAdministradores();
    this.successMessage = 'Administrador eliminado exitosamente';
    this.cdr.detectChanges();
    
    setTimeout(() => {
      this.successMessage = '';
      this.cdr.detectChanges();
    }, 3000);
  }

  // ==================== MÉTODOS PARA AUXILIARES ====================

  /**
   * Cargar lista de auxiliares
   */
  cargarAuxiliares(): void {
    this.loading = true;
    this.errorMessage = '';

    this.auxiliarService.listarAuxiliares()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success && response.data) {
            this.auxiliares = response.data;
          } else {
            this.auxiliares = [];
          }
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = 'Error al cargar la lista de auxiliares';
          this.auxiliares = [];
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Manejar auxiliar creado
   */
  onAuxiliarCreado(): void {
    this.cargarAuxiliares();
    this.successMessage = 'Auxiliar creado exitosamente';
    this.cdr.detectChanges();
    
    setTimeout(() => {
      this.successMessage = '';
      this.cdr.detectChanges();
    }, 3000);
  }

  /**
   * Manejar auxiliar actualizado
   */
  onAuxiliarActualizado(): void {
    this.cargarAuxiliares();
    this.successMessage = 'Auxiliar actualizado exitosamente';
    this.cdr.detectChanges();
    
    setTimeout(() => {
      this.successMessage = '';
      this.cdr.detectChanges();
    }, 3000);
  }

  /**
   * Manejar auxiliar eliminado
   */
  onAuxiliarEliminado(): void {
    this.cargarAuxiliares();
    this.successMessage = 'Auxiliar eliminado exitosamente';
    this.cdr.detectChanges();
    
    setTimeout(() => {
      this.successMessage = '';
      this.cdr.detectChanges();
    }, 3000);
  }

  // ==================== MÉTODOS PARA ALUMNOS ====================

  /**
   * Cargar lista de alumnos
   */
  cargarAlumnos(): void {
    this.loading = true;
    this.errorMessage = '';

    this.alumnoService.listarAlumnos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success && response.data) {
            this.alumnos = response.data;
          } else {
            this.alumnos = [];
          }
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = 'Error al cargar la lista de alumnos';
          this.alumnos = [];
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Manejar alumno creado
   */
  onAlumnoCreado(): void {
    this.cargarAlumnos();
    this.successMessage = 'Alumno creado exitosamente';
    this.cdr.detectChanges();
    
    setTimeout(() => {
      this.successMessage = '';
      this.cdr.detectChanges();
    }, 3000);
  }

  /**
   * Manejar alumno actualizado
   */
  onAlumnoActualizado(): void {
    this.cargarAlumnos();
    this.successMessage = 'Alumno actualizado exitosamente';
    this.cdr.detectChanges();
    
    setTimeout(() => {
      this.successMessage = '';
      this.cdr.detectChanges();
    }, 3000);
  }

  /**
   * Manejar alumno eliminado
   */
  onAlumnoEliminado(): void {
    this.cargarAlumnos();
    this.successMessage = 'Alumno eliminado exitosamente';
    this.cdr.detectChanges();
    
    setTimeout(() => {
      this.successMessage = '';
      this.cdr.detectChanges();
    }, 3000);
  }
}
