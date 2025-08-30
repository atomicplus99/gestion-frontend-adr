// interfaces/usuario.interface.ts - Interfaces para gestión de usuarios

export interface Usuario {
  id_user: string;
  nombre_usuario: string;
  rol_usuario: string;
  profile_image: string;
  activo: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface CreateUsuarioDto {
  nombre_usuario: string;
  password: string;
  rol: string;
}

export interface UsuarioResponse {
  success: boolean;
  message: string;
  data: Usuario;
}

export interface UsuariosListResponse {
  success: boolean;
  message: string;
  data: {
    usuarios: Usuario[];
    total: number;
    page: number;
    limit: number;
  };
}

export interface EstadisticasUsuariosResponse {
  success: boolean;
  message: string;
  data: {
    totalUsuarios: number;
    usuariosActivos: number;
    usuariosInactivos: number;
    usuariosPorRol: {
      [key: string]: number;
    };
  };
}

export interface CambiarPasswordDto {
  passwordActual: string;
  passwordNueva: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  passwordNueva: string;
}

export interface UsuarioFilters {
  page?: number;
  limit?: number;
  search?: string;
  rol?: string;
  activo?: boolean;
}

// Enums para roles
export enum RolUsuario {
  ADMIN = 'ADMIN',
  ADMINISTRADOR = 'ADMINISTRADOR',
  DIRECTOR = 'DIRECTOR',
  AUXILIAR = 'AUXILIAR',
  ALUMNO = 'ALUMNO'
}