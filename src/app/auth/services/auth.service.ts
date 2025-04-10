import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserInfo } from '../interfaces/user-info.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor() { }

  private http = inject(HttpClient);

  async isAuthenticated(){
    try {
      await firstValueFrom(
        this.http.get(`${environment.apiUrl}/auth/me`, {
          withCredentials: true,
        })
      );
      return true;
    } catch {
      return false;
    }
  }

  getUserInfo(): Observable<UserInfo> {
    return this.http.get<UserInfo>(`${environment.apiUrl}/auth/me`, { withCredentials: true });
  }
  

}
