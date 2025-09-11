// ====================================
// ARCHIVO: src/app/modules/excel/components/excel/excel.component.ts
// ====================================

import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnInit, OnDestroy, ViewChild, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';


import { ExcelImportService } from '../../services/excel-import.service';

import { ExcelStateService } from '../../services/excel-state.service';

// Componentes del módulo Excel
import { ExcelWidgetsComponent } from '../excel-widgets/excel-widgets.component';
import { ExcelNotificationService } from '../../services/excel-notificacion.service';
import { TurnoModuleExcel } from '../../models/turno-excel.model';
import { AlumnoModuleExcel } from '../../models/alumno-excel.model';
import { ExcelImportRequest, ExcelWidgetData } from '../../models/excel-import.model';
import { EXCEL_MESSAGES } from '../../constants/excel.constants';
import { ExcelValidators } from '../../validators/excel.validators';


@Component({
  selector: 'app-excel',
  standalone: true,
  imports: [
    FormsModule, 
    CommonModule,
    ExcelWidgetsComponent
  ],
  templateUrl: './excel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExcelComponent implements OnInit, OnDestroy {
  
  // Inyección de dependencias
  private readonly excelImportService = inject(ExcelImportService);
  private readonly notificationService = inject(ExcelNotificationService);
  private readonly stateService = inject(ExcelStateService);
  private readonly cdr = inject(ChangeDetectorRef);

  // Referencias del DOM
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  // Estado del componente
  turnos: TurnoModuleExcel[] = [];
  alumnos: AlumnoModuleExcel[] = [];
  widgets: ExcelWidgetData = {
    importadosHoy: 0,
    registrosConError: 0,
    usuariosCreados: 0,
    porcentajeUsuariosCreados: 0,
    tiempoProceso: 0
  };

  // Variables del formulario
  selectedFile: File | null = null;
  selectedTurnoId: string | null = null;
  private _crearUsuarios = true;
  isLoading = false;

  // Getter para asegurar que crearUsuarios siempre sea true
  get crearUsuarios(): boolean {
    return true;
  }

  set crearUsuarios(value: boolean) {
    this._crearUsuarios = true; // Siempre forzar a true
  }

  
  // Utilitarios
  Math = Math;
  
  // Subject para cleanup de subscripciones
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.initializeComponent();
    this.subscribeToStateChanges();
    // Asegurar que crearUsuarios esté siempre en true
    this.crearUsuarios = true;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ====================================
  // MÉTODOS DE INICIALIZACIÓN
  // ====================================

  private initializeComponent(): void {
    this.cargarTurnos();
    this.resetearFormulario();
  }

  private subscribeToStateChanges(): void {
    // Suscribirse a cambios en el estado
    this.stateService.getAlumnos()
      .pipe(takeUntil(this.destroy$))
      .subscribe(alumnos => {
        // Asegurar que alumnos sea un array
        this.alumnos = Array.isArray(alumnos) ? alumnos : [];
        this.cdr.detectChanges();
      });

    this.stateService.getTurnos()
      .pipe(takeUntil(this.destroy$))
      .subscribe(turnos => {
        // Asegurar que turnos sea un array
        this.turnos = Array.isArray(turnos) ? turnos : [];
        this.cdr.detectChanges();
      });

    this.stateService.getWidgets()
      .pipe(takeUntil(this.destroy$))
      .subscribe(widgets => {
        this.widgets = widgets;
        this.cdr.detectChanges();
      });

    this.stateService.isLoading()
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.isLoading = loading;
        this.cdr.detectChanges();
      });

  }

  // ====================================
  // MÉTODOS DE CARGA DE DATOS
  // ====================================

  cargarTurnos(): void {
    this.stateService.setLoading(true);
    
    this.excelImportService.obtenerTurnos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (turnos) => {
          this.stateService.setTurnos(turnos);
        },
        error: (error) => {
          console.error('Error al cargar turnos:', error);
          this.notificationService.error(
            EXCEL_MESSAGES.ERROR.NETWORK,
            'Error al cargar turnos'
          );
        },
        complete: () => {
          this.stateService.setLoading(false);
        }
      });
  }

  // ====================================
  // MÉTODOS DE MANEJO DE ARCHIVOS
  // ====================================

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validar tipo de archivo
      const fileTypeValidator = ExcelValidators.excelFileType();
      const fileSizeValidator = ExcelValidators.excelFileSize();
      
      const typeValidation = fileTypeValidator({ value: file } as any);
      const sizeValidation = fileSizeValidator({ value: file } as any);
      
      if (typeValidation) {
        this.notificationService.error(EXCEL_MESSAGES.ERROR.FILE_FORMAT);
        this.resetFileInput();
        return;
      }
      
      if (sizeValidation) {
        this.notificationService.error(EXCEL_MESSAGES.ERROR.FILE_SIZE);
        this.resetFileInput();
        return;
      }
      
      this.selectedFile = file;
      this.stateService.setSelectedFile(file);
    }
    
    this.cdr.detectChanges();
  }

  private resetFileInput(): void {
    this.selectedFile = null;
    this.stateService.setSelectedFile(null);
    if (this.fileInputRef) {
      this.fileInputRef.nativeElement.value = '';
    }
  }

  // ====================================
  // MÉTODOS DE IMPORTACIÓN
  // ====================================

  onImport(): void {
    if (!this.validarFormulario()) {
      return;
    }

    const startTime = new Date().getTime();
    this.stateService.setLoading(true);

    const request: ExcelImportRequest = {
      file: this.selectedFile!,
      turno_id: this.selectedTurnoId!,
      crear_usuarios: this.crearUsuarios
    };

    this.excelImportService.importarAlumnos(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.procesarRespuestaImportacion(response, startTime);
        },
        error: (error) => {
          this.manejarErrorImportacion(error);
        },
        complete: () => {
          this.stateService.setLoading(false);
          this.resetearFormulario();
        }
      });
  }

  private validarFormulario(): boolean {
    if (!this.selectedFile || !this.selectedTurnoId) {
      this.notificationService.validationError();
      return false;
    }
    return true;
  }

  private procesarRespuestaImportacion(response: any, startTime: number): void {
    const endTime = new Date().getTime();
    const tiempoProceso = Math.round((endTime - startTime) / 1000);
    
    // Actualizar estado con los resultados
    this.stateService.setAlumnos(response.alumnos || []);
    
    // Calcular y actualizar widgets
    const widgets = this.excelImportService.calcularEstadisticas(
      response.alumnos || [], 
      tiempoProceso
    );
    this.stateService.setWidgets(widgets);
    
    
    // Mostrar notificación de éxito
    this.notificationService.importSuccess(response.total || 0);
  }

  private manejarErrorImportacion(error: any): void {
    console.error('Error al importar:', error);
    this.notificationService.importError(error.message);
  }


  private limpiarResultados(): void {
    this.stateService.clearResults();
    this.notificationService.success(
      EXCEL_MESSAGES.SUCCESS.CLEAR,
      'Tabla Limpiada'
    );
  }

  private resetearFormulario(): void {
    this.resetFileInput();
    this.selectedTurnoId = null;
    this.stateService.setSelectedTurnoId(null);
  }
}