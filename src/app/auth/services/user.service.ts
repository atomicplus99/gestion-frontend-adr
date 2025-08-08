// services/auxiliar.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {  UserAuxiliarResponse } from './responses/AuxiliarResponse.interface';
import { environment } from '../../../environments/environment';



@Injectable({
  providedIn: 'root'
})
export class UserService {


  constructor(private http: HttpClient) {}

  /**
   * Obtiene información del auxiliar por ID de usuario
   * @param idUser ID del usuario
   * @returns Observable con datos del auxiliar
   */
  obtenerAuxiliarPorUsuario(idUser: string): Observable<UserAuxiliarResponse> {
    return this.http.get<UserAuxiliarResponse>(`${environment.apiUrl}/auxiliar/auxiliar-user/${idUser}`);
  }
}