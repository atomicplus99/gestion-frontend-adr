import { Turno } from "./Turno.model";



export interface Alumno {
  id_alumno: string;
  codigo: string;
  dni_alumno: string;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string;
  direccion: string;
  codigo_qr: string;
  nivel: string;
  grado: number;
  seccion: string;
  turno: Turno;
}

export interface AsistenciaResponse {
  id_asistencia: string;
  hora_de_llegada: string;
  hora_salida: string | null;
  estado_asistencia: string;
  fecha: string;
  alumno: Alumno;
  observaciones?: string;
}

export interface AsistenciaRowList {
  id: string;
  codigo: string;
  dni: string;
  nombre: string;
  apellido: string;
  nivel: string;
  grado: number;
  seccion: string;
  turno: string;
  horaLlegada: string;
  horaSalida: string | null;
  estado: 'PUNTUAL' | 'TARDANZA' | 'AUSENTE';
  fecha: string; // ISO string
  observaciones?: string;
}

export interface AsistenciaFilters {
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  turno: string;
  nivel: string;
  grado: string | number;
  seccion: string;
  searchText: string;
  dni: string;
}

export type ViewMode = 'table' | 'cards';