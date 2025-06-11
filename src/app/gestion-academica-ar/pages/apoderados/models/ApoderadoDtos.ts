// interfaces/apoderado.interface.ts
export interface Apoderado {
  id_apoderado: string;
  nombre: string;
  apellido?: string;
  telefono?: string;
  email?: string;
  dni?: string;
  tipo_relacion: TipoRelacion;
  relacion_especifica?: string;
  activo: boolean;
  fecha_creacion: Date;
  fecha_actualizacion: Date;
  pupilos?: Alumno[];
  medios_notificacion?: any[];
}

export interface CreateApoderadoDto {
  nombre: string;
  apellido?: string;
  telefono?: string;
  email?: string;
  dni?: string;
  tipo_relacion: TipoRelacion;
  relacion_especifica?: string;
  activo?: boolean;
}

export interface UpdateApoderadoDto {
  nombre?: string;
  apellido?: string;
  telefono?: string;
  email?: string;
  dni?: string;
  tipo_relacion?: TipoRelacion;
  relacion_especifica?: string;
  activo?: boolean;
}

export interface Alumno {
  id_alumno: string;
  codigo: string;
  dni_alumno: string;
  nombre: string;
  apellido: string;
  fecha_nacimiento: Date;
  direccion: string;
  codigo_qr: string;
  nivel: string;
  grado: number;
  seccion: string;
}

export type TipoRelacion = 
  | 'PADRE' 
  | 'MADRE' 
  | 'ABUELO' 
  | 'ABUELA' 
  | 'TIO' 
  | 'TIA' 
  | 'TUTOR' 
  | 'OTRO';