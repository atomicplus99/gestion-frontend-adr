import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CookieService {

  /**
   * Establece una cookie httpOnly (solo desde el backend)
   * Esta función es para documentación, las cookies httpOnly se establecen desde el servidor
   */
  setHttpOnlyCookie(name: string, value: string, options: any = {}): void {
    // NOTA: Las cookies httpOnly solo pueden ser establecidas por el servidor
    // Esta función es para cookies regulares si las necesitas
    const cookieString = this.buildCookieString(name, value, options);
    document.cookie = cookieString;
  }

  /**
   * Obtiene una cookie por nombre
   */
  getCookie(name: string): string | null {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) {
        return c.substring(nameEQ.length, c.length);
      }
    }
    return null;
  }

  /**
   * Elimina una cookie
   */
  deleteCookie(name: string, path: string = '/'): void {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
  }

  /**
   * Verifica si una cookie existe
   */
  hasCookie(name: string): boolean {
    return this.getCookie(name) !== null;
  }

  /**
   * Construye la cadena de cookie con opciones
   */
  private buildCookieString(name: string, value: string, options: any = {}): string {
    let cookieString = `${name}=${value}`;
    
    if (options.expires) {
      cookieString += `; expires=${options.expires.toUTCString()}`;
    }
    
    if (options.path) {
      cookieString += `; path=${options.path}`;
    }
    
    if (options.domain) {
      cookieString += `; domain=${options.domain}`;
    }
    
    if (options.secure) {
      cookieString += '; secure';
    }
    
    if (options.sameSite) {
      cookieString += `; samesite=${options.sameSite}`;
    }
    
    return cookieString;
  }

  /**
   * Obtiene todas las cookies como objeto
   */
  getAllCookies(): { [key: string]: string } {
    const cookies: { [key: string]: string } = {};
    const cookieArray = document.cookie.split(';');
    
    cookieArray.forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        cookies[name] = decodeURIComponent(value);
      }
    });
    
    return cookies;
  }
}
