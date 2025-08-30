export interface UsuarioCompleto {
  id_user: string;
  nombre_usuario: string;
  rol_usuario: 'ALUMNO' | 'AUXILIAR' | 'ADMINISTRADOR' | 'DIRECTOR';
  profile_image: string;
  activo: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string;
  
  alumno?: {
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
  };
  
  auxiliar?: {
    id_auxiliar: string;
    nombre: string;
    apellido: string;
    correo_electronico: string;
    telefono: string;
    dni_auxiliar: string;
    fecha_nacimiento: string;
  };
  
  administrador?: {
    id_administrador: string;
    nombres: string;
    apellidos: string;
    email: string;
    telefono: string;
    direccion: string;
  };
  
  director?: {
    id_director: string;
    nombres: string;
    apellidos: string;
    email: string;
    telefono: string;
    direccion: string;
  };
}

export interface UsuariosCompletosResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: {
    usuarios: UsuarioCompleto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface FiltrosUsuarios {
  rol?: 'ALUMNO' | 'AUXILIAR' | 'ADMINISTRADOR' | 'DIRECTOR';
  activo?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}