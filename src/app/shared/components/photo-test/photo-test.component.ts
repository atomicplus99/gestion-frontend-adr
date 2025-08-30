import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PhotoService } from '../../services/photo.service';
import { UserStoreService } from '../../../auth/store/user.store';

@Component({
  selector: 'app-photo-test',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="photo-test-container">
      <h3>Prueba de Carga de Fotos</h3>
      
             <div class="user-info">
         <p><strong>Usuario ID:</strong> {{ userId() }}</p>
         <p><strong>Estado:</strong> {{ status() }}</p>
         <p><strong>URL de la foto:</strong> {{ photoUrl() }}</p>
         <p><strong>En cache:</strong> {{ isCached() ? 'Sí' : 'No' }}</p>
         <p><strong>Cache persistente:</strong> {{ hasPersistentCache() ? 'Sí' : 'No' }}</p>
       </div>

             <div class="photo-display">
         <h4>Foto del Usuario:</h4>
         <img 
           *ngIf="photoUrl()" 
           [src]="photoUrl()" 
           alt="Foto de perfil"
           class="user-photo"
           (error)="onImageError($event)"
           (load)="onImageLoad($event)">
         <div *ngIf="!photoUrl()" class="no-photo">
           <p>No hay foto disponible</p>
           <p class="subtitle">El usuario no ha subido una foto de perfil</p>
         </div>
       </div>

      <div class="actions">
        <button (click)="loadPhoto()" [disabled]="loading()">
          {{ loading() ? 'Cargando...' : 'Cargar Foto' }}
        </button>
        <button (click)="clearCache()">Limpiar Cache</button>
      </div>
    </div>
  `,
  styles: [`
    .photo-test-container {
      padding: 20px;
      border: 1px solid #ccc;
      border-radius: 8px;
      margin: 20px;
      max-width: 500px;
    }
    
    .user-info {
      background: #f5f5f5;
      padding: 10px;
      border-radius: 4px;
      margin-bottom: 15px;
    }
    
    .user-info p {
      margin: 5px 0;
    }
    
    .photo-display {
      text-align: center;
      margin-bottom: 15px;
    }
    
    .user-photo {
      max-width: 200px;
      max-height: 200px;
      border-radius: 50%;
      border: 2px solid #ddd;
    }
    
         .no-photo {
       color: #666;
       font-style: italic;
       text-align: center;
       padding: 20px;
     }
     
     .no-photo .subtitle {
       font-size: 0.9em;
       color: #999;
       margin-top: 5px;
     }
    
    .actions {
      display: flex;
      gap: 10px;
    }
    
    button {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    
    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `]
})
export class PhotoTestComponent implements OnInit {
  private photoService = inject(PhotoService);
  private userStore = inject(UserStoreService);

  userId = signal<string>('');
  photoUrl = signal<string>('');
  status = signal<string>('Inicializando...');
  loading = signal<boolean>(false);
  isCached = signal<boolean>(false);
  hasPersistentCache = signal<boolean>(false);

  ngOnInit() {
    const user = this.userStore.getUserSilently();
    if (user?.idUser) {
      this.userId.set(user.idUser);
      this.loadPhoto();
    } else {
      this.status.set('No hay usuario autenticado');
    }
  }

  loadPhoto() {
    const userId = this.userId();
    if (!userId) return;

    this.loading.set(true);
    this.status.set('Cargando foto...');
    this.updateCacheStatus();

    this.photoService.getUserPhoto(userId).subscribe({
      next: (url) => {
        this.photoUrl.set(url);
        this.status.set(url ? 'Foto cargada exitosamente' : 'No hay foto disponible');
        this.loading.set(false);
        this.updateCacheStatus();
      },
      error: (error) => {
        this.status.set('Error al cargar la foto');
        this.photoUrl.set('');
        this.loading.set(false);
        this.updateCacheStatus();
      }
    });
  }

  updateCacheStatus() {
    const userId = this.userId();
    if (userId) {
      this.isCached.set(this.photoService.isPhotoCached(userId));
      this.hasPersistentCache.set(!!localStorage.getItem(`photo_${userId}`));
    }
  }

  clearCache() {
    this.photoService.clearPhotoCache();
    this.status.set('Cache limpiado');
    this.updateCacheStatus();
  }

  onImageLoad(event: any) {
    this.status.set('Imagen cargada correctamente');
  }

  onImageError(event: any) {
    this.status.set('Error al cargar la imagen');
    event.target.style.display = 'none';
  }
}
