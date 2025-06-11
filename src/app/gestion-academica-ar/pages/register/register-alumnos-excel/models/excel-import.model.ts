import { AlumnoModuleExcel } from './alumno-excel.model';

export interface ExcelImportRequest {
  file: File;
  turno_id: string;
  crear_usuarios: boolean;
}

export interface ExcelImportResponse {
  success: boolean;
  message: string;
  total: number;
  alumnos: AlumnoModuleExcel[];
  errores?: ExcelImportError[];
}

export interface ExcelImportError {
  fila: number;
  errores: string[];
  datos_parciales?: Partial<AlumnoModuleExcel>;
}

export interface ExcelImportStats {
  total_importados: number;
  usuarios_creados: number;
  registros_con_error: number;
  tiempo_proceso: number;
  porcentaje_exito: number;
  importados_hoy: number;
  porcentaje_usuarios_creados: number;
}

export interface ExcelWidgetData {
  importadosHoy: number;
  registrosConError: number;
  usuariosCreados: number;
  porcentajeUsuariosCreados: number;
  tiempoProceso: number;
}