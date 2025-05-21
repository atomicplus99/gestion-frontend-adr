export interface TurnoModuleExcel {
  id_turno: string;
  turno: string;
  hora_inicio: string;
  hora_fin: string;
  hora_limite: string;
}

export interface UsuarioModuleExcel {
  id_user: string;
  nombre_usuario: string;
  password_user: string;
  rol_usuario: string;
  profile_image: string;
}

export interface AlumnoModuleExcel {
  id_alumno: string;
  codigo: string;
  dni_alumno: string;
  nombre: string;
  apellido: string;
  nivel: string;
  grado: number;
  seccion: string;
  fecha_nacimiento: Date;
  direccion: string;
  codigo_qr: string;
  turno: TurnoModuleExcel;
  usuario?: UsuarioModuleExcel;
}