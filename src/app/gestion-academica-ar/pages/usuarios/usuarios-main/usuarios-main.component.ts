import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { AdministracionPersonalComponent } from '../administracion-personal/administracion-personal.component';
import { ListaUsuariosComponent } from '../lista-usuarios/lista-usuarios.component';
import { CreateUsuarioComponent } from '../create-usuario/create-usuario.component';
import { ErrorToastComponent } from '../../../../shared/components/error-toast/error-toast.component';

@Component({
  selector: 'app-usuarios-main',
  standalone: true,
  imports: [
    CommonModule, 
    AdministracionPersonalComponent, 
    ListaUsuariosComponent,
    CreateUsuarioComponent,
    ErrorToastComponent
  ],
  templateUrl: './usuarios-main.component.html',
  styleUrls: ['./usuarios-main.component.css']
})
export class UsuariosMainComponent implements OnInit, OnDestroy {
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  // Estado
  selectedTab = 'lista-usuarios';
  
  // Opciones de pestañas
  tabs = [
    { id: 'lista-usuarios', label: 'Lista Usuarios', icon: '👥', description: 'Visualizar todos los usuarios', disabled: false },
    { id: 'crear-usuario', label: 'Crear Usuario', icon: '➕', description: 'Registrar nuevo usuario', disabled: false },
    { id: 'administracion-personal', label: 'Administración Personal', icon: '👨‍💼', description: 'Gestionar directores y personal', disabled: false }
  ];

  ngOnInit(): void {
    // Inicialización si es necesaria
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Cambiar pestaña activa
   */
  cambiarTab(tabId: string): void {
    this.selectedTab = tabId;
    this.cdr.detectChanges();
  }

  /**
   * Obtener clase CSS para pestaña
   */
  getTabClass(tabId: string): string {
    const isActive = this.selectedTab === tabId;
    const baseClass = 'flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200';
    
    if (isActive) {
      return `${baseClass} bg-blue-100 text-blue-700 border border-blue-200`;
    } else {
      return `${baseClass} text-gray-600 hover:text-gray-900 hover:bg-gray-50`;
    }
  }

  /**
   * Verificar si una pestaña está activa
   */
  isTabActive(tabId: string): boolean {
    return this.selectedTab === tabId;
  }
}
