import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class LogoutService {
  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  logout() {
    // Limpiar el token local
    this.authService.clearToken();
    
    // Llamar al endpoint de logout del backend
    return this.http.post(`${environment.apiUrl}/auth/logout`, {}, { withCredentials: true });
  }
}