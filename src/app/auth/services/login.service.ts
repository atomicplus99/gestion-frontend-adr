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
        console.log('🔐 LoginService: Iniciando proceso de login');
        console.log('📍 URL de login:', `${this.API_URL}/auth/login`);
        console.log('👤 Usuario:', username);
        console.log('🔑 Password length:', password?.length || 0);
        
        const loginData = { username, password };
        console.log('📤 Datos enviados:', loginData);
        
        return this.httpClient.post<any>(`${this.API_URL}/auth/login`,
            loginData,
            { withCredentials: true }
        ).pipe(
            tap(response => {
                console.log('✅ LoginService: Respuesta recibida del servidor');
                console.log('📥 Response completa:', response);
                
                // Guardar el token en sessionStorage usando TokenService
                if (response && response.access_token) {
                    console.log('🎫 Token encontrado en access_token');
                    console.log('🎫 Access token:', response.access_token?.substring(0, 20) + '...');
                    this.tokenService.storeToken(response.access_token);

                } else if (response && response.token) {
                    console.log('🎫 Token encontrado en token');
                    console.log('🎫 Token:', response.token?.substring(0, 20) + '...');
                    this.tokenService.storeToken(response.token);

                } else {
                    console.warn('⚠️ No se encontró token en la respuesta');
                    console.log('🔍 Estructura de respuesta:', Object.keys(response || {}));
                }
            })
        );
    }
}