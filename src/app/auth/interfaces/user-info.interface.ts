// interfaces/user-info.interface.ts - Actualizada según la API del backend
export interface UserInfo {
  idUser: string;
  username: string;
  role: 'AUXILIAR' | 'ALUMNO' | 'DIRECTOR' | 'ADMINISTRADOR' | 'ADMIN';
  photo: string; // URL completa de la foto que viene del servidor
  auxiliar?: {
    id_auxiliar: string;
    dni_auxiliar: string;
    nombre: string;
    apellido: string;
    correo_electronico: string;
    telefono: string;
  } | null;
  alumno?: {
    id_alumno: string;
    dni_alumno: string;
    nombre: string;
    apellido: string;
    fecha_nacimiento: string;
    direccion: string;
    telefono: string;
    correo_electronico: string;
    id_apoderado?: string;
  } | null;
  director?: {
    id_director: string;
    dni_director: string;
    nombres: string;
    apellidos: string;
    correo_electronico: string;
    telefono: string;
  } | null;
  administrador?: {
    id_administrador: string;
    nombres: string;
    apellidos: string;
    email: string;
    telefono: string;
    direccion: string;
    id_user: string;
  } | null;
}

// Interfaz para la respuesta completa del login
export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    access_token: string;
    user: UserInfo;
  };
}