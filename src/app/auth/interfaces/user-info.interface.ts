// interfaces/user-info.interface.ts - Actualizada
export interface UserInfo {
  idUser: string;
  username: string;
  role: string;
  photo: string;
  nombreCompleto: string;
  // 🆕 NUEVOS CAMPOS PARA AUXILIAR
  id_auxiliar?: string;
  auxiliarInfo?: {
    dni_auxiliar: string;
    nombre: string;
    apellido: string;
    correo_electronico: string;
    telefono: string;
  };
  // 🆕 INDICADOR SI TIENE ACCESO AL REGISTRO MANUAL
  puedeRegistrarAsistencia?: boolean;
}