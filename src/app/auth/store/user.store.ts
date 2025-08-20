// services/user-store.service.ts - Actualizado
import { Injectable, signal } from "@angular/core";
import { UserInfo } from "../interfaces/user-info.interface";

import { firstValueFrom } from "rxjs";
import { UserAuxiliarResponse } from "../services/responses/AuxiliarResponse.interface";
import { UserService } from "../services/user.service";

@Injectable({
  providedIn: 'root'
})
export class UserStoreService {
  private _user = signal<UserInfo | null>(null);

  constructor(private auxiliarService: UserService) {}

  /**
   * Establece el usuario y obtiene información del auxiliar si aplica
   * @param user Información básica del usuario
   */
  async setUser(user: UserInfo): Promise<void> {
    try {


      // Intentar obtener información del auxiliar
      const auxiliarInfo = await this.obtenerInfoAuxiliar(user.idUser);
      
      if (auxiliarInfo) {
        // Usuario es auxiliar/admin con acceso
        const userConAuxiliar: UserInfo = {
          ...user,
          id_auxiliar: auxiliarInfo.id_auxiliar,
          auxiliarInfo: {
            dni_auxiliar: auxiliarInfo.dni_auxiliar,
            nombre: auxiliarInfo.nombre,
            apellido: auxiliarInfo.apellido,
            correo_electronico: auxiliarInfo.correo_electronico,
            telefono: auxiliarInfo.telefono
          },
          puedeRegistrarAsistencia: true
        };
        
        this._user.set(userConAuxiliar);

      } else {
        // Usuario sin permisos de auxiliar
        const userSinAuxiliar: UserInfo = {
          ...user,
          puedeRegistrarAsistencia: false
        };
        
        this._user.set(userSinAuxiliar);

      }

    } catch (error) {
      console.error('❌ Error al establecer usuario:', error);
      
      // Establecer usuario sin permisos de auxiliar en caso de error
      const userSinAuxiliar: UserInfo = {
        ...user,
        puedeRegistrarAsistencia: false
      };
      
      this._user.set(userSinAuxiliar);
    }
  }

  /**
   * Obtiene información del auxiliar para un usuario
   * @param idUser ID del usuario
   * @returns Información del auxiliar o null si no es auxiliar
   */
  private async obtenerInfoAuxiliar(idUser: string): Promise<any | null> {
    try {
      const response = await firstValueFrom(
        this.auxiliarService.obtenerAuxiliarPorUsuario(idUser)
      );
      
      if (response.success && response.data) {

        return response.data;
      }
      
      return null;
    } catch (error: any) {
      
      
      // Error 403: Sin permisos (rol ALUMNO)
      // Error 404: No tiene auxiliar asociado
      // Ambos casos significan que no puede registrar asistencia
      return null;
    }
  }

  /**
   * Obtiene el usuario actual (readonly)
   */
  get user() {
    return this._user.asReadonly();
  }

  /**
   * Obtiene el ID del auxiliar actual
   * @returns ID del auxiliar o null si no es auxiliar
   */
  get idAuxiliar(): string | null {
    return this._user()?.id_auxiliar || null;
  }

  /**
   * Verifica si el usuario actual puede registrar asistencia
   * @returns true si puede registrar asistencia
   */
  get puedeRegistrarAsistencia(): boolean {
    return this._user()?.puedeRegistrarAsistencia || false;
  }

  /**
   * Limpia la información del usuario
   */
  clearUser(): void {
    this._user.set(null);
  }

  /**
   * Fuerza la actualización de información del auxiliar
   * Útil si los permisos cambian durante la sesión
   */
  async actualizarInfoAuxiliar(): Promise<void> {
    const usuarioActual = this._user();
    if (usuarioActual) {
      await this.setUser(usuarioActual);
    }
  }
}