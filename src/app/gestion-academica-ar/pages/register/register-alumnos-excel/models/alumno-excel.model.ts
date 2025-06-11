import { TurnoModuleExcel } from './turno-excel.model';
import { UsuarioModuleExcel } from './usuario-excel.model';

export interface AlumnoModuleExcel {
  id_alumno: string;
  codigo: string;
  dni_alumno: string;
  nombre: string;
  apellido: string;
  nivel: NivelEducativoExcel;
  grado: number;
  seccion: string;
  fecha_nacimiento: Date;
  direccion: string;
  codigo_qr: string;
  turno: TurnoModuleExcel;
  usuario?: UsuarioModuleExcel;
}

export enum NivelEducativoExcel {
  INICIAL = 'Inicial',
  PRIMARIA = 'Primaria',
  SECUNDARIA = 'Secundaria'
}

export enum SeccionExcelEnum {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
  E = 'E'
}

export type AlumnoExcelCreateDto = Omit<AlumnoModuleExcel, 'id_alumno' | 'codigo' | 'codigo_qr' | 'turno'> & {
  turno_id: string;
};

export type AlumnoExcelUpdateDto = Partial<AlumnoExcelCreateDto>;

export interface AlumnoExcelConUsuario extends AlumnoModuleExcel {
  usuario: UsuarioModuleExcel;
}