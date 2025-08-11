import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, tap } from 'rxjs';
import { UserInfo } from '../interfaces/user-info.interface';

@Injectable({providedIn: 'root'})
export class LoginService {

    private readonly API_URL = environment.apiUrl;

    constructor(private httpClient: HttpClient) { }

    login(username:string, password:string){
        console.log('🔐 Iniciando login para usuario:', username);
        console.log('🔐 URL del backend:', this.API_URL);
        
        return this.httpClient.post<any>(`${this.API_URL}/auth/login`,
            { username , password },
            { withCredentials: true }
        ).pipe(
            tap(response => {
                console.log('🔐 Respuesta del login recibida:', response);
                
                // Guardar el token en localStorage
                if (response && response.access_token) {
                    localStorage.setItem('access_token', response.access_token);
                    console.log('✅ Token guardado exitosamente (access_token)');
                    console.log('✅ Token en localStorage:', localStorage.getItem('access_token') ? 'SÍ' : 'NO');
                } else if (response && response.token) {
                    localStorage.setItem('access_token', response.token);
                    console.log('✅ Token guardado exitosamente (token)');
                    console.log('✅ Token en localStorage:', localStorage.getItem('access_token') ? 'SÍ' : 'NO');
                } else {
                    console.log('❌ No se encontró token en la respuesta');
                    console.log('❌ Estructura de la respuesta:', JSON.stringify(response, null, 2));
                }
            })
        );
    }
}