import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, tap } from 'rxjs';
import { UserInfo } from '../interfaces/user-info.interface';
import { TokenService } from './token.service';

@Injectable({providedIn: 'root'})
export class LoginService {

    private readonly API_URL = environment.apiUrl;

    constructor(
        private httpClient: HttpClient,
        private tokenService: TokenService
    ) { }

    login(username:string, password:string){
        console.log('🔐 Iniciando login para usuario:', username);
        console.log('🔐 URL del backend:', this.API_URL);
        
        return this.httpClient.post<any>(`${this.API_URL}/auth/login`,
            { username , password },
            { withCredentials: true }
        ).pipe(
            tap(response => {
                console.log('🔐 Respuesta del login recibida:', response);
                
                // Guardar el token en sessionStorage usando TokenService
                if (response && response.access_token) {
                    this.tokenService.storeToken(response.access_token);
                    console.log('✅ Token guardado exitosamente (access_token)');
                    console.log('✅ Token en sessionStorage:', this.tokenService.isTokenValid() ? 'SÍ' : 'NO');
                } else if (response && response.token) {
                    this.tokenService.storeToken(response.token);
                    console.log('✅ Token guardado exitosamente (token)');
                    console.log('✅ Token en sessionStorage:', this.tokenService.isTokenValid() ? 'SÍ' : 'NO');
                } else {
                    console.log('❌ No se encontró token en la respuesta');
                    console.log('❌ Estructura de la respuesta:', JSON.stringify(response, null, 2));
                }
            })
        );
    }
}