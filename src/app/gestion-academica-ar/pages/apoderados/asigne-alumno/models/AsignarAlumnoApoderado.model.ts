// interfaces/apoderado.interface.ts
export interface Apoderado {
  id_apoderado: string;
  nombre: string;
  apellido?: string;
  telefono?: string;
  email?: string;
  dni?: string;
  tipo_relacion: string;
  relacion_especifica?: string;
  activo: boolean;
  fecha_creacion: Date;
  fecha_actualizacion: Date;
  pupilos?: any[];
  medios_notificacion?: any[];
}

// interfaces/alumno.interface.ts
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
  turno?: any;
  usuario?: any;
  apoderado?: Apoderado;
}

// interfaces/assign-request.interface.ts
export interface AssignStudentsRequest {
  estudiante_ids: string[];
}