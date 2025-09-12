import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { UsuariosCompletosService } from '../services/usuarios-completos.service';
import { UsuarioCompleto, FiltrosUsuarios } from '../interfaces/usuario-completo.interface';
import { ErrorHandlerService } from '../../../../shared/services/error-handler.service';
import { PhotoService } from '../../../../shared/services/photo.service';
import { UserStoreService } from '../../../../auth/store/user.store';
import { AlertsService } from '../../../../shared/alerts.service';

@Component({
  selector: 'app-lista-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './lista-usuarios.component.html',
  styleUrls: ['./lista-usuarios.component.css']
})
export class ListaUsuariosComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private usuariosService = inject(UsuariosCompletosService);
  private errorHandler = inject(ErrorHandlerService);
  private photoService = inject(PhotoService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private userStore = inject(UserStoreService);
  private alertsService = inject(AlertsService);

  // Estados
  usuarios: UsuarioCompleto[] = [];
  cargando = false;
  cargandoFotos = false;
  
  // Estados para eliminación
  eliminando = false;
  usuarioAEliminar: UsuarioCompleto | null = null;
  mostrarModalEliminar = false;
  
  // Estados para edición
  editando = false;
  usuarioAEditar: UsuarioCompleto | null = null;
  mostrarModalEditar = false;
  editandoFoto = false;
  archivoSeleccionado: File | null = null;
  previewFoto: string | null = null;
  
  // Cache de fotos de perfil
  fotosPerfil: { [key: string]: string } = {};

  // Datos completos y filtrados
  todosLosUsuarios: UsuarioCompleto[] = [];
  usuariosFiltrados: UsuarioCompleto[] = [];

  // Paginación
  paginaActual = 1;
  elementosPorPagina = 10;
  totalElementos = 0;
  totalPaginas = 0;

  // Filtros
  filtrosForm: FormGroup;
  
  // Formulario de edición
  editarForm: FormGroup;
  roles = [
    { value: '', label: 'Todos los roles' },
    { value: 'ALUMNO', label: 'Alumno' },
    { value: 'AUXILIAR', label: 'Auxiliar' },
    { value: 'ADMINISTRADOR', label: 'Administrador' },
    { value: 'DIRECTOR', label: 'Director' }
  ];

  estados = [
    { value: '', label: 'Todos los estados' },
    { value: 'true', label: 'Activo' },
    { value: 'false', label: 'Inactivo' }
  ];

  constructor() {
    this.filtrosForm = this.fb.group({
      rol: [''],
      activo: [''],
      search: ['']
    });
    
    this.editarForm = this.fb.group({
      nombre_usuario: ['', [Validators.required, Validators.minLength(3)]],
      rol_usuario: [{value: '', disabled: true}], // Deshabilitado desde la creación
      activo: [true, [Validators.required]]
    });
    

  }

  ngOnInit(): void {
    this.cargarUsuarios();
    this.configurarFiltros();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Configurar filtros reactivos
   */
  private configurarFiltros(): void {

    
    // Filtro de búsqueda con debounce
    this.filtrosForm.get('search')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.paginaActual = 1;
        this.aplicarFiltrosLocales();
      });

    // Filtros de rol y estado
    this.filtrosForm.get('rol')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {

        this.paginaActual = 1;
        this.aplicarFiltrosLocales();
      });

    this.filtrosForm.get('activo')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {

        this.paginaActual = 1;
        this.aplicarFiltrosLocales();
      });
  }

  /**
   * Cargar usuarios con filtros actuales (método principal)
   */
  cargarUsuarios(): void {
    if (this.todosLosUsuarios.length > 0) {
      // Si ya tenemos datos, solo aplicar filtros locales
      this.aplicarFiltrosLocales();
      return;
    }

    this.cargando = true;
    this.cargandoFotos = false;

    // Cargar todos los usuarios sin filtros (límite máximo permitido por el backend)
    this.usuariosService.obtenerUsuariosCompletos({
      page: 1,
      limit: 100 // Límite máximo permitido por el backend
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.cargando = false;
          
          if (response && response.success && response.data) {
            this.todosLosUsuarios = response.data.usuarios || [];

            
            // Mostrar notificación de carga exitosa
            if (this.todosLosUsuarios.length > 0) {
              this.alertsService.success(
                `Se cargaron ${this.todosLosUsuarios.length} usuarios exitosamente.${this.todosLosUsuarios.length === 100 ? ' (Máximo permitido por página)' : ''}`,
                'Usuarios Cargados'
              );
            } else {
              this.alertsService.info(
                'No se encontraron usuarios en la base de datos.',
                'Sin Usuarios'
              );
            }
            
            this.aplicarFiltrosLocales();
            this.cargarFotosPerfil();
          } else {
            this.todosLosUsuarios = [];
            this.usuarios = [];
            this.totalElementos = 0;
            this.totalPaginas = 0;

          }
          
          this.cdr.detectChanges();
          setTimeout(() => {
            this.cdr.detectChanges();
          }, 50);
        },
        error: (error) => {
          this.cargando = false;
          this.errorHandler.handleHttpError(error, 'Error al cargar usuarios');
          this.alertsService.error(
            'No se pudieron cargar los usuarios. Verifica tu conexión a internet.',
            'Error de Carga'
          );
          this.cdr.detectChanges();
          setTimeout(() => {
            this.cdr.detectChanges();
          }, 50);
        }
      });
  }

  /**
   * Aplicar filtros localmente a los datos ya cargados
   */
  private aplicarFiltrosLocales(): void {
    const rolValue = this.filtrosForm.get('rol')?.value;
    const activoValue = this.filtrosForm.get('activo')?.value;
    const searchValue = this.filtrosForm.get('search')?.value;

    // Obtener el ID del usuario autenticado
    const usuarioAutenticado = this.userStore.user();
    const idUsuarioAutenticado = usuarioAutenticado?.idUser;

    // Filtrar usuarios - excluir al usuario autenticado
    let usuariosFiltrados = [...this.todosLosUsuarios];
    
    // Excluir al usuario autenticado
    if (idUsuarioAutenticado) {
      usuariosFiltrados = usuariosFiltrados.filter(usuario => 
        usuario.id_user !== idUsuarioAutenticado
      );
    }

    // Filtro por rol
    if (rolValue && rolValue.trim() !== '') {
      usuariosFiltrados = usuariosFiltrados.filter(usuario => 
        usuario.rol_usuario === rolValue
      );
    }

    // Filtro por estado activo
    if (activoValue && activoValue.trim() !== '') {
      const esActivo = activoValue === 'true';
      usuariosFiltrados = usuariosFiltrados.filter(usuario => 
        usuario.activo === esActivo
      );
    }

    // Filtro por búsqueda de texto
    if (searchValue && searchValue.trim() !== '') {
      const terminoBusqueda = searchValue.toLowerCase().trim();
      usuariosFiltrados = usuariosFiltrados.filter(usuario => {
        // Buscar en nombre de usuario
        if (usuario.nombre_usuario.toLowerCase().includes(terminoBusqueda)) {
          return true;
        }
        
        // Buscar en datos específicos según el rol
        if (usuario.alumno) {
          return usuario.alumno.nombre.toLowerCase().includes(terminoBusqueda) ||
                 usuario.alumno.apellido.toLowerCase().includes(terminoBusqueda);
        }
        if (usuario.auxiliar) {
          return usuario.auxiliar.nombre.toLowerCase().includes(terminoBusqueda) ||
                 usuario.auxiliar.apellido.toLowerCase().includes(terminoBusqueda);
        }
        if (usuario.administrador) {
          return usuario.administrador.nombres.toLowerCase().includes(terminoBusqueda) ||
                 usuario.administrador.apellidos.toLowerCase().includes(terminoBusqueda) ||
                 usuario.administrador.email.toLowerCase().includes(terminoBusqueda);
        }
        if (usuario.director) {
          return usuario.director.nombres.toLowerCase().includes(terminoBusqueda) ||
                 usuario.director.apellidos.toLowerCase().includes(terminoBusqueda) ||
                 usuario.director.email.toLowerCase().includes(terminoBusqueda);
        }
        
        return false;
      });
    }

    this.usuariosFiltrados = usuariosFiltrados;
    this.aplicarPaginacion();
  }

  /**
   * Aplicar paginación a los usuarios filtrados
   */
  private aplicarPaginacion(): void {
    this.totalElementos = this.usuariosFiltrados.length;
    this.totalPaginas = Math.ceil(this.totalElementos / this.elementosPorPagina);
    
    const inicio = (this.paginaActual - 1) * this.elementosPorPagina;
    const fin = inicio + this.elementosPorPagina;
    
    this.usuarios = this.usuariosFiltrados.slice(inicio, fin);
    

    
    // Cargar fotos de los usuarios de la nueva página
    this.cargarFotosPaginaActual();
    
    this.cdr.detectChanges();
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 50);
  }

  /**
   * Cargar fotos de los usuarios de la página actual
   */
  private cargarFotosPaginaActual(): void {
    if (this.usuarios.length === 0) {
      return;
    }

    this.cargandoFotos = true;
    let fotosCargadas = 0;
    const totalFotos = this.usuarios.length;

    this.usuarios.forEach(usuario => {
      if (!this.fotosPerfil[usuario.id_user]) {
        this.usuariosService.obtenerUrlFotoPerfil(usuario.id_user)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response) => {
              if (response.success && response.data?.foto_url) {
                this.fotosPerfil[usuario.id_user] = response.data.foto_url;
              }
              fotosCargadas++;
              
              // Si todas las fotos están cargadas, ocultar el loader
              if (fotosCargadas >= totalFotos) {
                this.cargandoFotos = false;
              }
              
              this.cdr.detectChanges();
              
              setTimeout(() => {
                this.cdr.detectChanges();
              }, 50);
            },
            error: (error) => {
              this.fotosPerfil[usuario.id_user] = 'assets/default-avatar.png';
              fotosCargadas++;
              
              // Mostrar notificación amigable
              this.alertsService.info(
                `No se pudo cargar la foto de ${usuario.nombre_usuario}. Se mostrará el avatar por defecto.`,
                'Foto no disponible'
              );
              
              // Si todas las fotos están cargadas, ocultar el loader
              if (fotosCargadas >= totalFotos) {
                this.cargandoFotos = false;
              }
              
              this.cdr.detectChanges();
              
              setTimeout(() => {
                this.cdr.detectChanges();
              }, 50);
            }
          });
      } else {
        fotosCargadas++;
        if (fotosCargadas >= totalFotos) {
          this.cargandoFotos = false;
        }
      }
    });
  }

  /**
   * Cambiar página
   */
  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
      this.aplicarPaginacion();
    }
  }

  /**
   * Cambiar elementos por página
   */
  cambiarElementosPorPagina(): void {
    this.paginaActual = 1;
    this.aplicarPaginacion();
  }

  /**
   * Limpiar filtros
   */
  limpiarFiltros(): void {
    this.filtrosForm.reset();
    this.paginaActual = 1;
    this.aplicarFiltrosLocales();
  }

  /**
   * Abrir modal de edición para usuario
   */
  abrirModalEditar(usuario: UsuarioCompleto): void {
    this.usuarioAEditar = usuario;
    this.mostrarModalEditar = true;
    this.archivoSeleccionado = null;
    this.previewFoto = null;
    
    // Bloquear el scroll del body
    document.body.style.overflow = 'hidden';
    
    // Cargar datos del usuario en el formulario
    this.editarForm.patchValue({
      nombre_usuario: usuario.nombre_usuario,
      rol_usuario: usuario.rol_usuario, // Se mantiene el rol original
      activo: usuario.activo
    });
    
    // El campo de rol ya está deshabilitado desde la creación
    
    // Cargar foto actual
    this.previewFoto = this.obtenerFotoPerfil(usuario.id_user);
    
    this.cdr.detectChanges();
  }

  /**
   * Cerrar modal de edición
   */
  cerrarModalEditar(): void {
    this.mostrarModalEditar = false;
    this.usuarioAEditar = null;
    this.editando = false;
    this.editandoFoto = false;
    this.archivoSeleccionado = null;
    this.previewFoto = null;
    
    // Restaurar el scroll del body
    document.body.style.overflow = '';
    
    this.editarForm.reset();
    
    this.cdr.detectChanges();
  }

  /**
   * Seleccionar archivo de foto
   */
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validar tipo de archivo
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        this.alertsService.error('Solo se permiten archivos JPG, JPEG y PNG', 'Tipo de Archivo Inválido');
        this.cdr.detectChanges();
        return;
      }
      
      // Validar tamaño (5MB máximo)
      if (file.size > 5 * 1024 * 1024) {
        this.alertsService.error('El archivo no puede ser mayor a 5MB', 'Archivo Demasiado Grande');
        this.cdr.detectChanges();
        return;
      }
      
      this.archivoSeleccionado = file;
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewFoto = e.target?.result as string;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  /**
   * Confirmar edición de usuario
   */
  confirmarEdicion(): void {
    if (!this.usuarioAEditar || this.editarForm.invalid) {
      this.alertsService.error(
        'Por favor, complete todos los campos requeridos',
        'Campos Requeridos'
      );
      this.cdr.detectChanges();
      return;
    }

    this.editando = true;

    const datosActualizacion = {
      nombre_usuario: this.editarForm.get('nombre_usuario')?.value,
      // rol_usuario no se incluye ya que no se puede editar
      activo: this.editarForm.get('activo')?.value
    };

    // Validación adicional: asegurar que el rol no se modifique
    if (this.usuarioAEditar && this.editarForm.get('rol_usuario')?.value !== this.usuarioAEditar.rol_usuario) {
      this.alertsService.error(
        'El rol del usuario no se puede modificar. Operación cancelada.',
        'Rol No Modificable'
      );
      this.editando = false;
      this.cdr.detectChanges();
      return;
    }

    // Actualizar datos básicos del usuario
    this.usuariosService.actualizarUsuario(this.usuarioAEditar.id_user, datosActualizacion)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            // Si hay archivo seleccionado, actualizar foto
            if (this.archivoSeleccionado) {
              this.actualizarFoto();
            } else {
              this.finalizarEdicion(response.data);
            }
          } else {
            this.editando = false;
            this.alertsService.error(
              response.message || 'Error al actualizar usuario',
              'Error de Actualización'
            );
            this.cdr.detectChanges();
          }
        },
        error: (error) => {
          this.editando = false;
          this.errorHandler.handleHttpError(error, 'Error al actualizar usuario');
          this.alertsService.error(
            'Error al actualizar usuario. Intenta nuevamente.',
            'Error de Actualización'
          );
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Actualizar foto de perfil
   */
  private actualizarFoto(): void {
    if (!this.usuarioAEditar || !this.archivoSeleccionado) return;

    this.editandoFoto = true;
    
    this.usuariosService.subirFotoPerfil(this.usuarioAEditar.id_user, this.archivoSeleccionado)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.editandoFoto = false;
          if (response.success) {
            // Limpiar cache inmediatamente
            delete this.fotosPerfil[this.usuarioAEditar!.id_user];
            
            // Obtener la nueva URL de foto directamente del servidor
            this.usuariosService.obtenerUrlFotoPerfil(this.usuarioAEditar!.id_user)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (response) => {
                  if (response.success && response.data?.foto_url) {
                    // Actualizar cache con la nueva URL
                    this.fotosPerfil[this.usuarioAEditar!.id_user] = response.data.foto_url;
                    
                    // Actualizar el usuario en la lista
                    const usuarioConFotoActualizada = {
                      ...this.usuarioAEditar,
                      profile_image: response.data.foto_url
                    };
                    
                    this.finalizarEdicion(usuarioConFotoActualizada);
                  } else {
                    this.finalizarEdicion(this.usuarioAEditar);
                  }
                },
                error: (error) => {
                  this.alertsService.error('Error al obtener nueva foto', 'Error de Foto');
                  this.finalizarEdicion(this.usuarioAEditar);
                }
              });
                              } else {
                      this.alertsService.error(
                        response.message || 'Error al actualizar foto',
                        'Error de Foto'
                      );
                      this.cdr.detectChanges();
                    }
        },
        error: (error) => {
          this.editandoFoto = false;
          this.errorHandler.handleHttpError(error, 'Error al actualizar foto');
          this.alertsService.error(
            'Error al actualizar foto. Intenta nuevamente.',
            'Error de Foto'
          );
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Finalizar proceso de edición
   */
  private finalizarEdicion(usuarioActualizado: any): void {
    this.editando = false;
    this.editandoFoto = false;
    
    // Actualizar la lista local
    if (this.usuarioAEditar) {
      const index = this.todosLosUsuarios.findIndex(
        u => u.id_user === this.usuarioAEditar!.id_user
      );
      if (index !== -1) {
        this.todosLosUsuarios[index] = { ...this.todosLosUsuarios[index], ...usuarioActualizado };
      }
      
      this.aplicarFiltrosLocales();
      
      // Forzar recarga de foto si se cambió
      if (this.archivoSeleccionado && this.usuarioAEditar) {
        setTimeout(() => {
          this.forzarRecargaFoto(this.usuarioAEditar!.id_user);
        }, 200);
      }
    }
    
    // El campo de rol permanece deshabilitado
    
    this.mostrarModalEditar = false;
    this.usuarioAEditar = null;
    this.editando = false;
    this.editandoFoto = false;
    this.archivoSeleccionado = null;
    this.previewFoto = null;
    
    // Restaurar el scroll del body
    document.body.style.overflow = '';
    
    this.editarForm.reset();
    this.cdr.detectChanges();
    
    // Mostrar notificación de éxito
    this.alertsService.success(
      `Usuario ${usuarioActualizado.nombre_usuario} actualizado exitosamente.`,
      'Usuario Actualizado'
    );
    
    this.cdr.detectChanges();
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 50);
  }

  /**
   * Abrir modal de confirmación para eliminar usuario
   */
  abrirModalEliminar(usuario: UsuarioCompleto): void {
    this.usuarioAEliminar = usuario;
    this.mostrarModalEliminar = true;
    
    // Bloquear el scroll del body
    document.body.style.overflow = 'hidden';
    
    this.cdr.detectChanges();
  }

  /**
   * Cerrar modal de eliminación
   */
  cerrarModalEliminar(): void {
    this.mostrarModalEliminar = false;
    this.usuarioAEliminar = null;
    this.eliminando = false;
    
    // Restaurar el scroll del body
    document.body.style.overflow = '';
    
    this.cdr.detectChanges();
  }

  /**
   * Confirmar eliminación de usuario
   */
  confirmarEliminacion(): void {
    if (!this.usuarioAEliminar) return;

    this.eliminando = true;

    this.usuariosService.eliminarUsuario(this.usuarioAEliminar.id_user)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.eliminando = false;
          
          if (response.success) {
            
            // Actualizar la lista local antes de cerrar el modal
            if (this.usuarioAEliminar) {
              this.todosLosUsuarios = this.todosLosUsuarios.filter(
                usuario => usuario.id_user !== this.usuarioAEliminar!.id_user
              );
            }
            this.aplicarFiltrosLocales();
            
            // Cerrar el modal después de actualizar la lista (solo si fue exitoso)
            setTimeout(() => {
              this.mostrarModalEliminar = false;
              this.usuarioAEliminar = null;
              this.eliminando = false;
              
              // Restaurar el scroll del body
              document.body.style.overflow = '';
              
              this.cdr.detectChanges();
            }, 1000);
            
            this.alertsService.success(
              `Usuario ${this.usuarioAEliminar!.nombre_usuario} eliminado exitosamente.`,
              'Usuario Eliminado'
            );
            
            this.cdr.detectChanges();
            setTimeout(() => {
              this.cdr.detectChanges();
            }, 50);
          } else {
            this.alertsService.error(
              response.message || 'Error al eliminar usuario.',
              'Error de Eliminación'
            );
            // NO cerrar el modal cuando hay error - mantenerlo abierto para mostrar el mensaje
            this.cdr.detectChanges();
          }
        },
        error: (error) => {
          this.eliminando = false;
          
          this.alertsService.error('Error al eliminar usuario', 'Error de Eliminación');
          
          // Manejar error específico de referencias
          if (error.status === 409) {
            const mensajeError = 'No se puede eliminar este usuario porque está siendo utilizado en el sistema. Por favor, contacte con el administrador o vaya a Administración de Personal para realizar el proceso.';
            this.alertsService.error(mensajeError, 'Error de Eliminación');
          } else if (error.status === 404) {
            const mensajeError = 'El usuario no fue encontrado. Puede que ya haya sido eliminado.';
            this.alertsService.error(mensajeError, 'Error de Eliminación');
          } else if (error.status === 403) {
            const mensajeError = 'No tiene permisos para eliminar este usuario.';
            this.alertsService.error(mensajeError, 'Error de Eliminación');
          } else {
            const mensajeError = error.error?.message || 'Error al eliminar usuario. Intenta nuevamente.';
            this.alertsService.error(mensajeError, 'Error de Eliminación');
          }
          
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Obtener información del usuario según su rol
   */
  obtenerInfoUsuario(usuario: UsuarioCompleto): string {
    switch (usuario.rol_usuario) {
      case 'ALUMNO':
        return usuario.alumno ? `${usuario.alumno.nombre} ${usuario.alumno.apellido} (${usuario.alumno.codigo})` : 'Sin información';
      case 'AUXILIAR':
        return usuario.auxiliar ? `${usuario.auxiliar.nombre} ${usuario.auxiliar.apellido}` : 'Sin información';
      case 'ADMINISTRADOR':
        return usuario.administrador ? `${usuario.administrador.nombres} ${usuario.administrador.apellidos}` : 'Sin información';
      case 'DIRECTOR':
        return usuario.director ? `${usuario.director.nombres} ${usuario.director.apellidos}` : 'Sin información';
      default:
        return 'Sin información';
    }
  }

  /**
   * Obtener email del usuario según su rol
   */
  obtenerEmailUsuario(usuario: UsuarioCompleto): string {
    switch (usuario.rol_usuario) {
      case 'AUXILIAR':
        return usuario.auxiliar?.correo_electronico || 'Sin email';
      case 'ADMINISTRADOR':
        return usuario.administrador?.email || 'Sin email';
      case 'DIRECTOR':
        return usuario.director?.email || 'Sin email';
      default:
        return 'Sin email';
    }
  }

  /**
   * Obtener clase CSS para el estado del usuario
   */
  obtenerClaseEstado(activo: boolean): string {
    return activo 
      ? 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'
      : 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800';
  }

  /**
   * Obtener clase CSS para el rol del usuario
   */
  obtenerClaseRol(rol: string): string {
    switch (rol) {
      case 'ALUMNO':
        return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800';
      case 'AUXILIAR':
        return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800';
      case 'ADMINISTRADOR':
        return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800';
      case 'DIRECTOR':
        return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800';
      default:
        return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800';
    }
  }

  /**
   * Generar array de páginas para la paginación
   */
  obtenerPaginas(): number[] {
    const paginas: number[] = [];
    const inicio = Math.max(1, this.paginaActual - 2);
    const fin = Math.min(this.totalPaginas, this.paginaActual + 2);
    
    for (let i = inicio; i <= fin; i++) {
      paginas.push(i);
    }
    
    return paginas;
  }

  /**
   * Limpiar mensajes
   */

  /**
   * Función auxiliar para Math.min
   */
  getMin(a: number, b: number): number {
    return Math.min(a, b);
  }

  /**
   * Manejar error de carga de imagen
   */
  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = 'assets/default-avatar.png';
    }
  }

  /**
   * Cargar fotos de perfil para todos los usuarios
   */
  private cargarFotosPerfil(): void {
    if (this.usuarios.length === 0) {
      this.cargandoFotos = false;
      return;
    }

    this.cargandoFotos = true;
    let fotosCargadas = 0;
    const totalFotos = this.usuarios.length;

    this.usuarios.forEach(usuario => {
      if (!this.fotosPerfil[usuario.id_user]) {
        this.usuariosService.obtenerUrlFotoPerfil(usuario.id_user)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response) => {
              if (response.success && response.data?.foto_url) {
                this.fotosPerfil[usuario.id_user] = response.data.foto_url;
              }
              fotosCargadas++;
              
              // Si todas las fotos están cargadas, ocultar el loader
              if (fotosCargadas >= totalFotos) {
                this.cargandoFotos = false;
              }
              
              this.cdr.detectChanges();
              
              setTimeout(() => {
                this.cdr.detectChanges();
              }, 50);
            },
            error: (error) => {
              this.fotosPerfil[usuario.id_user] = 'assets/default-avatar.png';
              fotosCargadas++;
              
              // Mostrar notificación amigable
              this.alertsService.info(
                `No se pudo cargar la foto de ${usuario.nombre_usuario}. Se mostrará el avatar por defecto.`,
                'Foto no disponible'
              );
              
              // Si todas las fotos están cargadas, ocultar el loader
              if (fotosCargadas >= totalFotos) {
                this.cargandoFotos = false;
              }
              
              this.cdr.detectChanges();
              
              setTimeout(() => {
                this.cdr.detectChanges();
              }, 50);
            }
          });
      } else {
        fotosCargadas++;
        if (fotosCargadas >= totalFotos) {
          this.cargandoFotos = false;
        }
      }
    });
  }

  /**
   * Obtener foto de perfil desde el cache
   */
  obtenerFotoPerfil(idUsuario: string): string {
    const fotoUrl = this.fotosPerfil[idUsuario];
    if (fotoUrl) {
      // Forzar recarga desde servidor cada vez
      const separator = fotoUrl.includes('?') ? '&' : '?';
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const sessionId = Math.random().toString(36).substring(2, 15);
      return `${fotoUrl}${separator}t=${timestamp}&r=${random}&s=${sessionId}&nocache=true`;
    }
    return 'assets/default-avatar.png';
  }




  /**
   * Forzar recarga de foto específica
   */
  private forzarRecargaFoto(idUsuario: string): void {
    // Limpiar cache completamente
    delete this.fotosPerfil[idUsuario];
    
    // Hacer petición directa al endpoint
    this.usuariosService.obtenerUrlFotoPerfil(idUsuario)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data?.foto_url) {
            this.fotosPerfil[idUsuario] = response.data.foto_url;
            this.cdr.detectChanges();
          }
        },
        error: (error) => {
          this.alertsService.error('Error al recargar foto', 'Error de Recarga');
          this.alertsService.error(
            'No se pudo recargar la foto. Intenta recargar la página.',
            'Error de Recarga'
          );
        }
      });
  }
}