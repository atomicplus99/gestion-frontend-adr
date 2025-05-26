// ===========================
// qr-printer.component.ts
// ===========================

import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subscription, debounceTime, of, catchError } from 'rxjs';

interface Turno {
  id_turno: string;
  hora_inicio: string;
  hora_fin: string;
  hora_limite: string;
  turno: string;
}

interface Usuario {
  id_user: string;
  nombre_usuario: string;
  password_user: string;
  rol_usuario: string;
  profile_image: string;
}

interface Alumno {
  id_alumno: string;
  codigo: string;
  dni_alumno: string;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string;
  direccion: string;
  codigo_qr: string;
  nivel: string;
  grado: number;
  seccion: string;
  turno: Turno;
  usuario: Usuario;
}

@Component({
  selector: 'app-qr-printer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './codigos-qr-alumnos.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QrPrinterComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private cd = inject(ChangeDetectorRef);

  // Estados del componente
  alumnos: Alumno[] = [];
  alumnosSeleccionados: Set<string> = new Set();
  buscando = false;
  vistaPrevia = false;
  imprimiendo = false;

  // Filtros y búsqueda
  searchControl = new FormControl<string>('', { nonNullable: true });
  nivelFiltro = '';
  gradoFiltro = '';
  seccionFiltro = '';

  // Opciones
  nivelesEducativos = ['Inicial', 'Primaria', 'Secundaria'];
  grados = [1, 2, 3, 4, 5, 6];
  secciones = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

  // Configuración de impresión
  formatoImpresion = 'etiquetas'; // 'etiquetas' | 'lista' | 'individual'
  columnasPorFila = 3;
  tamanoQR = 'medium'; // 'small' | 'medium' | 'large'

  private subscriptions = new Subscription();

  ngOnInit() {
    this.cargarTodosLosAlumnos();
    
    // Debounce para búsqueda
    this.subscriptions.add(
      this.searchControl.valueChanges.pipe(
        debounceTime(300)
      ).subscribe(() => {
        this.filtrarAlumnos();
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  // Cargar todos los alumnos usando tu endpoint existente
  cargarTodosLosAlumnos() {
    this.buscando = true;
    this.cd.markForCheck();

    // Usar tu endpoint existente
    this.http.get<Alumno[]>('http://localhost:3000/alumnos').pipe(
      catchError(error => {
        console.error('Error al cargar alumnos:', error);
        return of([]);
      })
    ).subscribe(alumnos => {
      // Filtrar solo alumnos que tienen codigo_qr
      this.alumnos = alumnos.filter(a => a.codigo_qr && a.codigo_qr.trim() !== '');
      this.buscando = false;
      console.log(`Cargados ${this.alumnos.length} alumnos con código QR`);
      this.cd.markForCheck();
    });
  }

  // Buscar alumno específico por código
  buscarAlumnoPorCodigo(codigo: string) {
    if (!codigo || codigo.length !== 14) return;

    this.buscando = true;
    this.cd.markForCheck();

    this.http.get<Alumno>(`http://localhost:3000/alumnos/codigo/${codigo}`).pipe(
      catchError(error => {
        console.error('Error al buscar alumno:', error);
        return of(null);
      })
    ).subscribe(alumno => {
      this.buscando = false;
      if (alumno && alumno.codigo_qr) {
        // Agregar a la lista si no existe
        const exists = this.alumnos.find(a => a.id_alumno === alumno.id_alumno);
        if (!exists) {
          this.alumnos.unshift(alumno);
        }
      }
      this.cd.markForCheck();
    });
  }

  // Filtrar alumnos
  filtrarAlumnos() {
    // Este método se ejecuta automáticamente cuando cambian los filtros
    this.cd.markForCheck();
  }

  // Obtener alumnos filtrados
  get alumnosFiltrados(): Alumno[] {
    let filtrados = [...this.alumnos];
    
    // Filtro por texto
    const searchTerm = this.searchControl.value.toLowerCase().trim();
    if (searchTerm) {
      filtrados = filtrados.filter(alumno =>
        alumno.codigo.toLowerCase().includes(searchTerm) ||
        alumno.nombre.toLowerCase().includes(searchTerm) ||
        alumno.apellido.toLowerCase().includes(searchTerm) ||
        alumno.dni_alumno.includes(searchTerm)
      );
    }

    // Filtro por nivel
    if (this.nivelFiltro) {
      filtrados = filtrados.filter(alumno => alumno.nivel === this.nivelFiltro);
    }

    // Filtro por grado
    if (this.gradoFiltro) {
      filtrados = filtrados.filter(alumno => alumno.grado.toString() === this.gradoFiltro);
    }

    // Filtro por sección
    if (this.seccionFiltro) {
      filtrados = filtrados.filter(alumno => alumno.seccion === this.seccionFiltro);
    }

    return filtrados;
  }

  // Manejar selección individual
  toggleSeleccion(alumnoId: string) {
    if (this.alumnosSeleccionados.has(alumnoId)) {
      this.alumnosSeleccionados.delete(alumnoId);
    } else {
      this.alumnosSeleccionados.add(alumnoId);
    }
    this.cd.markForCheck();
  }

  // Seleccionar todos los filtrados
  seleccionarTodos() {
    const filtrados = this.alumnosFiltrados;
    if (this.todosSeleccionados) {
      // Deseleccionar todos los filtrados
      filtrados.forEach(alumno => {
        this.alumnosSeleccionados.delete(alumno.id_alumno);
      });
    } else {
      // Seleccionar todos los filtrados
      filtrados.forEach(alumno => {
        this.alumnosSeleccionados.add(alumno.id_alumno);
      });
    }
    this.cd.markForCheck();
  }

  // Verificar si todos están seleccionados
  get todosSeleccionados(): boolean {
    const filtrados = this.alumnosFiltrados;
    return filtrados.length > 0 && filtrados.every(alumno => 
      this.alumnosSeleccionados.has(alumno.id_alumno)
    );
  }

  // Obtener alumnos seleccionados
  get alumnosParaImprimir(): Alumno[] {
    return this.alumnos.filter(alumno => 
      this.alumnosSeleccionados.has(alumno.id_alumno)
    );
  }

  // Generar URL del código QR
  generarUrlQR(codigoQR: string, tamaño: number = 200): string {
    return `https://api.qrserver.com/v1/create-qr-code/?size=${tamaño}x${tamaño}&data=${encodeURIComponent(codigoQR)}`;
  }

  // Vista previa
  mostrarVistaPrevia() {
    if (this.alumnosSeleccionados.size === 0) {
      alert('Seleccione al menos un alumno para la vista previa');
      return;
    }
    this.vistaPrevia = true;
    this.cd.markForCheck();
  }

  cerrarVistaPrevia() {
    this.vistaPrevia = false;
    this.cd.markForCheck();
  }

  // Imprimir
  imprimir() {
    if (this.alumnosSeleccionados.size === 0) {
      alert('Seleccione al menos un alumno para imprimir');
      return;
    }

    this.imprimiendo = true;
    this.cd.markForCheck();

    // Pequeño delay para que se renderice el contenido
    setTimeout(() => {
      window.print();
      this.imprimiendo = false;
      this.cd.markForCheck();
    }, 500);
  }

  // Limpiar selección
  limpiarSeleccion() {
    this.alumnosSeleccionados.clear();
    this.cd.markForCheck();
  }

  // Limpiar filtros
  limpiarFiltros() {
    this.searchControl.setValue('');
    this.nivelFiltro = '';
    this.gradoFiltro = '';
    this.seccionFiltro = '';
    this.cd.markForCheck();
  }

  // Buscar por código específico
  onBuscarCodigo() {
    const codigo = this.searchControl.value.trim();
    if (codigo.length === 14) {
      this.buscarAlumnoPorCodigo(codigo);
    }
  }

  // TrackBy function para optimizar renderizado
  trackByAlumno(index: number, alumno: Alumno): string {
    return alumno.id_alumno;
  }

  // Obtener clases del tamaño QR
  get claseTamanoQR(): string {
    switch (this.tamanoQR) {
      case 'small': return 'w-20 h-20';
      case 'large': return 'w-40 h-40';
      default: return 'w-32 h-32';
    }
  }

  // Obtener tamaño numérico del QR
  get tamanoNumericoQR(): number {
    switch (this.tamanoQR) {
      case 'small': return 150;
      case 'large': return 300;
      default: return 200;
    }
  }

  // Recargar alumnos
  recargarAlumnos() {
    this.cargarTodosLosAlumnos();
  }

  // Obtener estadísticas
  get estadisticas() {
    const total = this.alumnos.length;
    const seleccionados = this.alumnosSeleccionados.size;
    const filtrados = this.alumnosFiltrados.length;
    
    return {
      total,
      seleccionados,
      filtrados,
      porcentajeSeleccion: total > 0 ? Math.round((seleccionados / total) * 100) : 0
    };
  }

  // Formatear fecha para mostrar
  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}