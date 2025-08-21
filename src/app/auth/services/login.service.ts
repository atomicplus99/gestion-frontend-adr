import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, tap } from 'rxjs';
import { UserInfo, LoginResponse } from '../interfaces/user-info.interface';
import { TokenService } from './token.service';

@Injectable({providedIn: 'root'})
export class LoginService {

    constructor(
        private httpClient: HttpClient,
        private tokenService: TokenService
    ) { }

    login(username: string, password: string): Observable<LoginResponse> {
        console.log('🔐 [LOGIN] Environment completo:', environment);
        console.log('🔐 [LOGIN] Environment API URL:', environment.apiUrl);
        console.log('🔐 [LOGIN] Tipo de environment.apiUrl:', typeof environment.apiUrl);
        console.log('🔐 [LOGIN] Ruta del environment importado:', '../../../environments/environment');
        const url = `${environment.apiUrl}/auth/login`;
        console.log('🔐 [LOGIN] URL construida:', url);
        console.log('🔐 [LOGIN] Credenciales:', { username, password: '***' });
        
        return this.httpClient.post<LoginResponse>(url,
            { username, password }
        ).pipe(
            tap(response => {
                console.log('✅ [LOGIN] Respuesta exitosa del backend:', response);
                if (response && response.access_token) {
                    console.log('🔑 [LOGIN] Token recibido, guardando en localStorage...');
                    this.tokenService.storeToken(response.access_token);
                    console.log('✅ [LOGIN] Token guardado exitosamente');
                    console.log('👤 [LOGIN] Usuario autenticado:', response.user);
                } else {
                    console.warn('⚠️ [LOGIN] Respuesta sin token:', response);
                }
            })
        );
    }
}