export interface TurnoShared {
  id_turno: string;
  hora_inicio: string;
  hora_fin: string;
  hora_limite: string;
  turno: string;
}

export interface UsuarioShared {
  id_user: string;
  nombre_usuario: string;
  password_user: string;
  rol_usuario: string;
  profile_image: string;
}

export interface AlumnoUpdateShared {
  id_alumno: string;
  codigo: string;
  dni_alumno: string;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string; // String para coincidir con backend
  direccion: string;
  codigo_qr?: string;
  nivel: string;
  grado: number;
  seccion: string;
  turno?: TurnoShared;
  usuario?: UsuarioShared;
}

// Respuesta real del backend para búsqueda
export interface AlumnoSearchResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: AlumnoUpdateShared;
}

// Respuesta real del backend para actualización
export interface AlumnoUpdateResponse {
  success: boolean;
  message: string;
  alumno: AlumnoUpdateShared;
  timestamp: string;
}

export interface UpdateAlumnoDto {
  codigo: string;
  dni_alumno: string;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string;
  direccion: string;
  codigo_qr?: string;
  nivel: string;
  grado: number;
  seccion: string;
  id_turno?: string;
}
