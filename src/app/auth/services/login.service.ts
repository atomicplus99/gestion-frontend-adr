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
        return this.httpClient.post<any>(`${this.API_URL}/auth/login`,
            { username , password },
            { withCredentials: true }
        )
    }



}