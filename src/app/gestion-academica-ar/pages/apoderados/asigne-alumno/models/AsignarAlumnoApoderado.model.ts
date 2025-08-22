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

// ✅ Interfaces para las respuestas del backend
export interface SuccessResponseDto<T> {
  success: boolean;
  message: string;
  timestamp?: string;
  data: T;
}

export interface ApoderadosResponseDto extends SuccessResponseDto<Apoderado[]> {
  // No necesita campos adicionales
}

export interface AlumnosResponseDto extends SuccessResponseDto<Alumno[]> {
  // No necesita campos adicionales
}

// ✅ Interfaces para respuestas de error del backend (exactas al backend)
export interface ErrorResponseDto {
  success: false;
  message: string;
  error: string;
  statusCode: number;
  timestamp: string;
}

export interface ConflictErrorResponseDto extends ErrorResponseDto {
  error: 'ALUMNOS_YA_ASIGNADOS';
  statusCode: 409;
  alumnosConApoderado: string[];
  suggestion: string;
}

export interface AssignmentErrorResponseDto extends ErrorResponseDto {
  error: 'ASSIGNMENT_ERROR';
  statusCode: 400;
}

// ✅ Interfaces para respuestas exitosas del backend
export interface SuccessAssignmentResponseDto {
  success: true;
  message: string;
  timestamp: string;
}