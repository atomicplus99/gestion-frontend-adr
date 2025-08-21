// interfaces/user-info.interface.ts - Actualizada según la API del backend
export interface UserInfo {
  idUser: string;
  username: string;
  role: 'AUXILIAR' | 'ALUMNO' | 'ADMIN';
  photo: string;
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
}

// Interfaz para la respuesta completa del login
export interface LoginResponse {
  message: string;
  access_token: string;
  user: UserInfo;
}