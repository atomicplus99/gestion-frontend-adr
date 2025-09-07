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
        const url = `${environment.apiUrl}/auth/login`;
        
        return this.httpClient.post<LoginResponse>(url,
            { username, password }
        ).pipe(
            tap(response => {
                if (response && response.data && response.data.access_token) {
                    this.tokenService.storeToken(response.data.access_token);
                }
            })
        );
    }
}