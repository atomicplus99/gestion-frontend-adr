// excel.component.ts
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

// Interfaces de modelo
export interface TurnoModuleExcel {
  id_turno: string;
  turno: string;
  hora_inicio: string;
  hora_fin: string;
  hora_limite: string;
}

export interface UsuarioModuleExcel {
  id_user: string;
  nombre_usuario: string;
  password_user: string;
  rol_usuario: string;
  profile_image: string;
}

export interface AlumnoModuleExcel {
  id_alumno: string;
  codigo: string;
  dni_alumno: string;
  nombre: string;
  apellido: string;
  nivel: string;
  grado: number;
  seccion: string;
  fecha_nacimiento: Date;
  direccion: string;
  codigo_qr: string;
  turno: TurnoModuleExcel;
  usuario?: UsuarioModuleExcel;
}

@Component({
  selector: 'app-excel',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './excel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExcelComponent implements OnInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  private apiUrl = 'http://localhost:3000/alumnos';
  
  // Variables del formulario
  selectedFile: File | null = null;
  selectedTurnoId: string | null = null;
  turnos: TurnoModuleExcel[] = [];
  alumnos: AlumnoModuleExcel[] = [];
  isLoading = false;
  crearUsuarios = true;

  // Variables de paginación
  paginaActual = 1;
  itemsPorPagina = 10;
  Math = Math;
  
  // Variables para widgets - inicializadas en cero
  importadosHoy: number = 0;
  registrosConError: number = 0;
  usuariosCreados: number = 0;
  porcentajeUsuariosCreados: number = 0;
  tiempoProceso: number = 0;

  ngOnInit(): void {
    this.cargarTurnos();
  }

  cargarTurnos(): void {
    this.isLoading = true;
    this.http.get<TurnoModuleExcel[]>('http://localhost:3000/turno')
      .subscribe({
        next: (data) => {
          this.turnos = data;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error al cargar turnos:', error);
          // Datos de muestra en caso de error
          this.turnos = [
            { id_turno: '1', turno: 'Mañana', hora_inicio: '07:00', hora_fin: '12:30', hora_limite: '13:00' },
            { id_turno: '2', turno: 'Tarde', hora_inicio: '13:00', hora_fin: '18:30', hora_limite: '19:00' },
            { id_turno: '3', turno: 'Noche', hora_inicio: '18:30', hora_fin: '22:00', hora_limite: '22:30' }
          ];
          Swal.fire({ 
            icon: 'error', 
            title: 'Error', 
            text: 'No se pudieron cargar los turnos. Se han cargado datos de muestra.', 
            confirmButtonColor: '#3085d6' 
          });
          this.cdr.detectChanges();
        },
        complete: () => {
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          file.type === 'application/vnd.ms-excel') {
        this.selectedFile = file;
      } else {
        Swal.fire({ 
          icon: 'error', 
          title: 'Formato incorrecto', 
          text: 'Selecciona un archivo Excel válido.', 
          confirmButtonColor: '#3085d6' 
        });
        this.selectedFile = null;
        input.value = '';
      }
      this.cdr.detectChanges();
    }
  }

  onImport(): void {
    if (!this.selectedFile || !this.selectedTurnoId) {
      Swal.fire({ 
        icon: 'warning', 
        title: 'Faltan datos', 
        text: 'Selecciona archivo y turno.', 
        confirmButtonColor: '#3085d6' 
      });
      return;
    }

    // Medir tiempo de inicio
    const startTime = new Date().getTime();
    
    this.isLoading = true;
    const formData = new FormData();
    formData.append('file', this.selectedFile);
    const url = `${this.apiUrl}/register-alumno-for-excel?turnoId=${this.selectedTurnoId}`;

    this.http.post<{ message: string, total: number, alumnos: AlumnoModuleExcel[] }>(url, formData)
      .subscribe({
        next: (res) => {
          this.alumnos = res.alumnos || [];
          this.paginaActual = 1;
          
          // ACTUALIZAR WIDGETS CON DATOS DE ESTA IMPORTACIÓN
          // 1. Número de alumnos importados en esta operación
          this.importadosHoy = this.alumnos.length;
          
          // 2. Usuarios creados automáticamente
          this.usuariosCreados = this.alumnos.filter(a => a.usuario).length;
          this.porcentajeUsuariosCreados = this.alumnos.length > 0
            ? Math.round((this.usuariosCreados / this.alumnos.length) * 100)
            : 0;
          
          // 3. Registros con errores (datos incompletos)
          this.registrosConError = this.alumnos.filter(a => 
            !a.dni_alumno || !a.nombre || !a.apellido || !a.nivel || !a.grado || !a.seccion
          ).length;
          
          // 4. Tiempo de proceso
          this.tiempoProceso = Math.round((new Date().getTime() - startTime) / 1000);
          
          Swal.fire({
            icon: 'success', 
            title: 'Importación exitosa', 
            text: `Se importaron ${res.total} alumnos.`,
            confirmButtonColor: '#3085d6'
          });
          
          this.selectedFile = null;
          if (this.fileInputRef) {
            this.fileInputRef.nativeElement.value = '';
          }
        },
        error: (err) => {
          console.error('Error al importar:', err);
          
          // Generar datos de muestra en caso de error con el backend
          this.generarDatosDePrueba();
          
          // Actualizar widgets con datos generados
          this.importadosHoy = this.alumnos.length;
          this.usuariosCreados = this.alumnos.filter(a => a.usuario).length;
          this.porcentajeUsuariosCreados = this.alumnos.length > 0
            ? Math.round((this.usuariosCreados / this.alumnos.length) * 100)
            : 0;
          this.registrosConError = this.alumnos.filter(a => 
            !a.dni_alumno || !a.nombre || !a.apellido || !a.nivel || !a.grado || !a.seccion
          ).length;
          this.tiempoProceso = Math.round((new Date().getTime() - startTime) / 1000);
          
          const errorMsg = 'No se pudo conectar con el servidor. Se han generado datos de muestra para demostración.';
          Swal.fire({ 
            icon: 'warning', 
            title: 'Importación con datos de muestra', 
            text: errorMsg, 
            confirmButtonColor: '#d33' 
          });
        },
        complete: () => {
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  // Genera datos de prueba para demostración cuando la API falla
  generarDatosDePrueba(): void {
    const niveles = ['Inicial', 'Primaria', 'Secundaria'];
    const secciones = ['A', 'B', 'C', 'D'];
    
    const turnoSeleccionado = this.turnos.find(t => t.id_turno === this.selectedTurnoId) || this.turnos[0];
    
    this.alumnos = [];
    
    // Generar entre 20 y 50 alumnos aleatorios
    const cantidadAlumnos = Math.floor(Math.random() * 30) + 20;
    
    for (let i = 1; i <= cantidadAlumnos; i++) {
      const nivel = niveles[Math.floor(Math.random() * niveles.length)];
      const grado = nivel === 'Inicial' ? Math.floor(Math.random() * 3) + 1 : 
                    nivel === 'Primaria' ? Math.floor(Math.random() * 6) + 1 : 
                    Math.floor(Math.random() * 5) + 1;
      const seccion = secciones[Math.floor(Math.random() * secciones.length)];
      
      const nombre = this.getNombreAleatorio();
      const apellido = this.getApellidoAleatorio();
      const dni = Math.floor(Math.random() * 90000000) + 10000000;
      const tieneUsuario = this.crearUsuarios && Math.random() > 0.1; // 90% de probabilidad de tener usuario si está activado
      
      const alumno: AlumnoModuleExcel = {
        id_alumno: crypto.randomUUID(),
        codigo: `ALU${(i).toString().padStart(4, '0')}`,
        dni_alumno: dni.toString(),
        nombre: nombre,
        apellido: apellido,
        nivel: nivel,
        grado: grado,
        seccion: seccion,
        fecha_nacimiento: new Date(2000 + Math.floor(Math.random() * 20), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        direccion: 'Av. Principal 123',
        codigo_qr: '',
        turno: turnoSeleccionado,
        usuario: tieneUsuario ? {
          id_user: crypto.randomUUID(),
          nombre_usuario: `${nombre.toLowerCase().charAt(0)}${apellido.toLowerCase().replace(/\s/g, '')}`,
          password_user: `${dni}${seccion}`,
          rol_usuario: 'alumno',
          profile_image: ''
        } : undefined
      };
      
      this.alumnos.push(alumno);
    }
    
    this.paginaActual = 1;
  }
  
  // Genera nombres aleatorios para los datos de prueba
  getNombreAleatorio(): string {
    const nombres = ['Ana', 'Luis', 'María', 'Carlos', 'Sofía', 'Juan', 'Valentina', 'Diego', 'Fernanda', 'Pedro', 'Lucía', 'José', 'Camila', 'Miguel', 'Isabella'];
    return nombres[Math.floor(Math.random() * nombres.length)];
  }
  
  // Genera apellidos aleatorios para los datos de prueba
  getApellidoAleatorio(): string {
    const apellidos = ['García', 'Rodríguez', 'López', 'Martínez', 'González', 'Pérez', 'Sánchez', 'Ramírez', 'Torres', 'Flores', 'Rivera', 'Gómez', 'Díaz', 'Reyes', 'Cruz'];
    return apellidos[Math.floor(Math.random() * apellidos.length)];
  }

  get totalPaginas(): number {
    return Math.ceil(this.alumnos.length / this.itemsPorPagina);
  }

  paginaAnterior(): void {
    if (this.paginaActual > 1) {
      this.paginaActual--;
      this.cdr.detectChanges();
    }
  }

  paginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas) {
      this.paginaActual++;
      this.cdr.detectChanges();
    }
  }

  irAPagina(pagina: number | string): void {
    if (typeof pagina === 'number' && pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
      this.cdr.detectChanges();
    }
  }

  cambiarItemsPorPagina(): void {
    this.paginaActual = 1;
    this.cdr.detectChanges();
  }

  obtenerPaginas(): (number | string)[] {
    const totalPag = this.totalPaginas;
    const paginaActual = this.paginaActual;
    const paginas: (number | string)[] = [];

    if (totalPag <= 7) {
      for (let i = 1; i <= totalPag; i++) {
        paginas.push(i);
      }
    } else {
      paginas.push(1);
      if (paginaActual > 3) {
        paginas.push('...');
      }
      let start = Math.max(2, paginaActual - 1);
      let end = Math.min(totalPag - 1, paginaActual + 1);
      if (paginaActual <= 3) {
        end = 4;
      }
      if (paginaActual >= totalPag - 2) {
        start = totalPag - 3;
      }
      for (let i = start; i <= end; i++) {
        paginas.push(i);
      }
      if (paginaActual < totalPag - 2) {
        paginas.push('...');
      }
      paginas.push(totalPag);
    }
    return paginas;
  }

  exportarExcel(): void {
    if (this.alumnos.length === 0) return;
    
    const data = this.alumnos.map(a => ({
      'Código': a.codigo,
      'DNI': a.dni_alumno,
      'Nombre': a.nombre,
      'Apellido': a.apellido,
      'Nivel': a.nivel,
      'Grado': a.grado,
      'Sección': a.seccion,
      'Fecha Nacimiento': new Date(a.fecha_nacimiento).toLocaleDateString(),
      'Usuario': a.usuario?.nombre_usuario || 'N/A',
      'Contraseña': a.usuario?.password_user || 'N/A'
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Alumnos');
    
    const fecha = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `alumnos_importados_${fecha}.xlsx`);
    
    Swal.fire({ 
      icon: 'success', 
      title: 'Exportación exitosa', 
      text: `Se ha exportado el archivo con ${this.alumnos.length} registros.`, 
      confirmButtonColor: '#28a745' 
    });
  }

  limpiarResultados(): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "Se borrarán los resultados de la importación de la tabla",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, limpiar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.alumnos = [];
        this.paginaActual = 1;
        
        // Resetear widgets cuando se limpia la tabla
        this.importadosHoy = 0;
        this.registrosConError = 0;
        this.usuariosCreados = 0;
        this.porcentajeUsuariosCreados = 0;
        this.tiempoProceso = 0;
        
        this.cdr.detectChanges();
        
        Swal.fire({
          icon: 'success',
          title: 'Tabla limpiada',
          text: 'Los datos han sido eliminados correctamente.',
          confirmButtonColor: '#3085d6'
        });
      }
    });
  }
}