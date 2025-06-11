export interface UsuarioModuleExcel {
  id_user: string;
  nombre_usuario: string;
  password_user: string;
  rol_usuario: RolUsuarioExcel;
  profile_image: string;
}

export enum RolUsuarioExcel {
  ADMIN = 'admin',
  ALUMNO = 'alumno',
  PROFESOR = 'profesor',
  PADRE = 'padre'
}

export type UsuarioExcelCreateDto = Omit<UsuarioModuleExcel, 'id_user'>;

export type UsuarioExcelUpdateDto = Partial<Omit<UsuarioExcelCreateDto, 'password_user'>>;

export type UsuarioExcelLoginDto = Pick<UsuarioModuleExcel, 'nombre_usuario' | 'password_user'>;