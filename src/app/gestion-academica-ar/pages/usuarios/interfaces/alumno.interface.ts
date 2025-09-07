export interface UsuarioAsignado {
  id_user: string;
  nombre_usuario: string;
  password_user: string;
  rol_usuario: string;
  profile_image: string;
  activo: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface Turno {
  id_turno: string;
  turno: string;
  hora_inicio: string;
  hora_fin: string;
  hora_limite: string;
}

export interface Apoderado {
  id_apoderado: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono?: string;
  direccion?: string;
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
  turno?: Turno | null;
  usuario?: UsuarioAsignado | null;
  apoderados?: Apoderado[];
  created_at?: string;
  updated_at?: string;
}

export interface CreateAlumnoDto {
  codigo: string;
  dni_alumno: string;
  nombre: string;
  apellido: string;
  fecha_nacimiento: Date;
  direccion: string;
  nivel: string;
  grado: number;
  seccion: string;
  turno_id: string;
}

export interface UpdateAlumnoDto {
  codigo?: string;
  dni_alumno?: string;
  nombre?: string;
  apellido?: string;
  fecha_nacimiento?: Date;
  direccion?: string;
  nivel?: string;
  grado?: number;
  seccion?: string;
  turno_id?: string;
}

export interface AlumnoResponse {
  success: boolean;
  message: string;
  data?: Alumno;
  statusCode?: number;
  timestamp?: string;
}

export interface AlumnoListResponse {
  success: boolean;
  message: string;
  data?: Alumno[];
  statusCode?: number;
  timestamp?: string;
}

// Interfaces para asignación de usuarios
export interface AsignarUsuarioDto {
  id_user: string;
  datos_personales: {
    codigo: string;
    dni_alumno: string;
    nombre: string;
    apellido: string;
    fecha_nacimiento: Date;
    direccion: string;
    nivel: string;
    grado: number;
    seccion: string;
    turno_id: string;
  };
}

export interface CambiarUsuarioDto {
  id_user: string | null;
}

export interface AsignarUsuarioResponse {
  success: boolean;
  message: string;
  data?: Alumno;
  statusCode?: number;
  timestamp?: string;
}

// Interface para usuarios disponibles
export interface UsuarioDisponible {
  id_user: string;
  nombre_usuario: string;
  rol_usuario: string;
  profile_image: string;
  activo: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface UsuariosDisponiblesResponse {
  success: boolean;
  message: string;
  data?: UsuarioDisponible[];
  statusCode?: number;
  timestamp?: string;
}
