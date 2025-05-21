export interface AlumnoEstado {
  codigo: string;
  dni_alumno: string;
  nombre: string;
  apellido: string;
  direccion: string;
  nivel: string;
  grado: number;
  seccion: string;
  turno: { turno: string };
  usuario: { nombre_usuario: string; rol_usuario: string };
  estado_actual: { estado: string; observacion: string; fecha_actualizacion: string };
  codigo_qr?: string;
  fecha_nacimiento?: string;
}