import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface PhotoResponse {
  success: boolean;
  message: string;
  data: {
    foto_url: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PhotoService {
  private readonly apiUrl = environment.apiUrl;
  private photoCache = new Map<string, string>();

  constructor(private http: HttpClient) {}

  /**
   * Obtener foto de perfil del usuario
   * Estrategia en dos pasos:
   * 1. GET /usuarios/{id}/foto → Obtener JSON con foto_url
   * 2. GET {foto_url} → Obtener la imagen real
   * 3. Hacer persistente la imagen
   */
  getUserPhoto(userId: string): Observable<string> {
    // Limpiar cache de URLs blob inválidas
    this.clearInvalidBlobUrls();

    // Verificar cache en memoria primero
    if (this.photoCache.has(userId)) {
      const cachedUrl = this.photoCache.get(userId)!;
      // Verificar que no sea una URL blob inválida
      if (!cachedUrl.startsWith('blob:')) {
        return of(cachedUrl);
      } else {
        // Limpiar URL blob inválida
        this.photoCache.delete(userId);
        this.clearCachedPhotoUrl(userId);
      }
    }

    // Verificar cache persistente en localStorage
    const cachedUrl = this.getCachedPhotoUrl(userId);
    if (cachedUrl && !cachedUrl.startsWith('blob:')) {
      // Cachear en memoria y retornar
      this.photoCache.set(userId, cachedUrl);
      return of(cachedUrl);
    }

    return this.getPhotoUrl(userId).pipe(
      switchMap(photoResponse => {
        if (photoResponse.success && photoResponse.data?.foto_url) {
          const photoUrl = photoResponse.data.foto_url;
          
          // PASO 2: Hacer GET a la URL de la foto para obtener la imagen real
          return this.http.get(photoUrl, { responseType: 'blob' }).pipe(
            map(blob => {
              // Cachear la URL original del backend (NO crear URLs temporales)
              this.photoCache.set(userId, photoUrl);
              this.setCachedPhotoUrl(userId, photoUrl);
              
              // Retornar la URL original del backend
              return photoUrl;
            }),
            catchError(() => {
              // Si falla, no mostrar nada
              return of('');
            })
          );
        }
        return of('');
      }),
      catchError(() => of(''))
    );
  }

  /**
   * Obtener solo la URL de la foto (primer paso)
   */
  private getPhotoUrl(userId: string): Observable<PhotoResponse> {
    return this.http.get<PhotoResponse>(`${this.apiUrl}/usuarios/${userId}/foto`);
  }



  /**
   * Obtener foto como Blob directamente
   */
  getUserPhotoAsBlob(userId: string): Observable<Blob> {
    return this.getPhotoUrl(userId).pipe(
      switchMap(photoResponse => {
        if (photoResponse.success && photoResponse.data?.foto_url) {
          return this.http.get(photoResponse.data.foto_url, { responseType: 'blob' });
        }
        return throwError(() => new Error('No se pudo obtener la URL de la foto'));
      })
    );
  }

  /**
   * Limpiar cache de fotos
   */
  clearPhotoCache(userId?: string): void {
    if (userId) {
      this.photoCache.delete(userId);
      this.clearCachedPhotoUrl(userId);
    } else {
      this.photoCache.clear();
      this.clearAllCachedPhotoUrls();
    }
  }

  /**
   * Verificar si una foto está en cache
   */
  isPhotoCached(userId: string): boolean {
    return this.photoCache.has(userId) || !!this.getCachedPhotoUrl(userId);
  }

  /**
   * Obtener URL de foto desde localStorage
   */
  private getCachedPhotoUrl(userId: string): string | null {
    try {
      const cachedUrl = localStorage.getItem(`photo_${userId}`);
      // Validar que la URL no sea de localhost:3000 (URLs antiguas)
      if (cachedUrl && cachedUrl.includes('localhost:3000')) {
        // Limpiar URL inválida
        localStorage.removeItem(`photo_${userId}`);
        return null;
      }
      return cachedUrl;
    } catch {
      return null;
    }
  }

  /**
   * Guardar URL de foto en localStorage
   */
  private setCachedPhotoUrl(userId: string, photoUrl: string): void {
    try {
      localStorage.setItem(`photo_${userId}`, photoUrl);
    } catch {
      // Si no se puede guardar en localStorage, no hacer nada
    }
  }

  /**
   * Limpiar URL de foto específica del localStorage
   */
  private clearCachedPhotoUrl(userId: string): void {
    try {
      localStorage.removeItem(`photo_${userId}`);
    } catch {
      // Si no se puede limpiar, no hacer nada
    }
  }

  /**
   * Limpiar todas las URLs de fotos del localStorage
   */
  private clearAllCachedPhotoUrls(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('photo_')) {
          localStorage.removeItem(key);
        }
      });
    } catch {
      // Si no se puede limpiar, no hacer nada
    }
  }

  /**
   * Limpiar URLs blob inválidas del cache
   */
  private clearInvalidBlobUrls(): void {
    // Limpiar cache en memoria
    for (const [userId, url] of this.photoCache.entries()) {
      if (url.startsWith('blob:') || url.includes('localhost:3000')) {
        this.photoCache.delete(userId);
        this.clearCachedPhotoUrl(userId);
      }
    }

    // Limpiar cache en localStorage
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('photo_')) {
          const url = localStorage.getItem(key);
          if (url && (url.startsWith('blob:') || url.includes('localhost:3000'))) {
            localStorage.removeItem(key);
          }
        }
      });
    } catch {
      // Si no se puede limpiar, no hacer nada
    }
  }
}
