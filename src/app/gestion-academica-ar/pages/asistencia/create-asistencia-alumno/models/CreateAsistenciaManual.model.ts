export interface TurnoAsistenciaManual {
  id_turno: string;
  hora_inicio: string;
  hora_fin: string;
  turno: string;
}

export interface AlumnoInfoAsistenciaManual {
  id_alumno: string;
  codigo: string;
  nombre: string;
  apellido: string;
  turno: TurnoAsistenciaManual;
}

export interface AsistenciaExistenteManual {
  id_asistencia: string;
  hora_de_llegada: string;
  hora_salida: string | null;
  estado_asistencia: string;
  fecha: Date;
}

export interface VerificarAsistenciaResponse {
  tiene_asistencia: boolean;
  mensaje: string;
  alumno?: AlumnoInfoAsistenciaManual;
  asistencia?: AsistenciaExistenteManual;
}

export interface RegistroAsistenciaRequestManual {
  id_alumno: string;
  hora_de_llegada: string;
  hora_salida?: string;
  estado_asistencia: 'PUNTUAL' | 'TARDANZA';
  motivo: string;
  id_auxiliar: string;
  fecha?: string;
}

export interface RegistroAsistenciaResponseManual {
  message: string;
  asistencia: {
    id_asistencia: string;
    hora_de_llegada: string;
    hora_salida?: string;
    estado_asistencia: string;
    fecha: Date;
    alumno: {
      nombre: string;
      apellido: string;
      codigo: string;
    };
  };
}

export interface EstadoInfoManualAsistencia {
  texto: string;
  accion: string;
}

export interface ErrorResponseManualAsistencia {
  status: number;
  error?: {
    message?: string;
  };
  message?: string;
}