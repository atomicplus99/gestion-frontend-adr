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

export interface Administrador {
  id_administrador: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono?: string;
  direccion?: string;
  usuario?: UsuarioAsignado | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateAdministradorDto {
  nombres: string;
  apellidos: string;
  email: string;
  telefono?: string;
  direccion?: string;
}

export interface UpdateAdministradorDto {
  nombres?: string;
  apellidos?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
}

export interface AdministradorResponse {
  success: boolean;
  message: string;
  data?: Administrador;
  statusCode?: number;
  timestamp?: string;
}

export interface AdministradorListResponse {
  success: boolean;
  message: string;
  data?: Administrador[];
  statusCode?: number;
  timestamp?: string;
}

// Interfaces para asignación de usuarios
export interface AsignarUsuarioDto {
  id_user: string;
  datos_personales: {
    nombres: string;
    apellidos: string;
    email: string;
    telefono?: string;
    direccion?: string;
  };
}

export interface CambiarUsuarioDto {
  id_user: string | null;
}

export interface AsignarUsuarioResponse {
  success: boolean;
  message: string;
  data?: Administrador;
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
