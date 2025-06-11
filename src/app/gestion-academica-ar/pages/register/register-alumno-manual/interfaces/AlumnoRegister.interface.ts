export interface Turno {
  id_turno: string;
  turno: string;
  hora_inicio: string;
  hora_fin: string;
}

export interface RegistroAlumnoDto {
  dni_alumno: string;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string;
  direccion: string;
  codigo_qr: string;
  codigo: string;
  turno_id: string;
  nivel: string;
  grado: number;
  seccion: string;
}

export interface FormProgress {
  percent: number;
  message: string;
  isComplete: boolean;
}

export type NivelEducativo = 'Inicial' | 'Primaria' | 'Secundaria';