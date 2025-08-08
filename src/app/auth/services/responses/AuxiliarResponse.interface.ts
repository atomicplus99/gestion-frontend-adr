export interface UserAuxiliarResponse {
  success: boolean;
  message: string;
  data: {
    id_auxiliar: string;
    dni_auxiliar: string;
    nombre: string;
    apellido: string;
    fecha_nacimiento: string;
    correo_electronico: string;
    telefono: string;
    usuario: {
      id_user: string;
      nombre_usuario: string;
      rol_usuario: string;
    };
  };
}