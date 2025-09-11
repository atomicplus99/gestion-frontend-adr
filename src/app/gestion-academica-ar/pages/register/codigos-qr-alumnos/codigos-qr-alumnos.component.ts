import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
  ViewChild,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subscription, debounceTime, of, catchError, forkJoin, map } from 'rxjs';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { environment } from '../../../../../environments/environment';

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
  @ViewChild('pdfContent', { static: false }) pdfContent!: ElementRef;
  
  private http = inject(HttpClient);
  private cd = inject(ChangeDetectorRef);

  // Estados del componente
  alumnos: Alumno[] = [];
  alumnosSeleccionados: Set<string> = new Set();
  buscando = false;
  vistaPrevia = false;
  generandoPDF = false;
  
  // Estados para carga de imágenes
  imagenesQRCargadas = new Map<string, boolean>();
  todasLasImagenesCargadas = false;

  // Filtros y búsqueda
  searchControl = new FormControl<string>('', { nonNullable: true });
  nivelFiltro = '';
  gradoFiltro = '';
  seccionFiltro = '';
  turnoFiltro = ''; // NUEVO FILTRO

  // Opciones
  nivelesEducativos = ['Inicial', 'Primaria', 'Secundaria'];
  grados = [1, 2, 3, 4, 5, 6];
  secciones = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
  turnos = ['mañana', 'tarde']; // NUEVAS OPCIONES

  // Configuración de impresión/PDF
  formatoImpresion = 'etiquetas'; // 'etiquetas' | 'lista' | 'individual'
  columnasPorFila = 3;
  tamanoQR = 'medium'; // 'small' | 'medium' | 'large'
  
  // Configuración de página para PDF
  orientacionPagina: 'portrait' | 'landscape' = 'portrait';
  tamanoPagina: 'a4' | 'letter' = 'a4';

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

    this.http.get<any>(`${environment.apiUrl}/alumnos`).pipe(
      map(response => {

        
        // ✅ Extraer el array de alumnos de la respuesta del backend
        let alumnos: Alumno[] = [];
        
        if (Array.isArray(response)) {
          // Si es un array directo
          alumnos = response;
        } else if (response && response.data && Array.isArray(response.data)) {
          // Si es { data: [...] }
          alumnos = response.data;
        } else if (response && response.alumnos && Array.isArray(response.alumnos)) {
          // Si es { alumnos: [...] }
          alumnos = response.alumnos;
        } else if (response && response.result && Array.isArray(response.result)) {
          // Si es { result: [...] }
          alumnos = response.result;
        } else {
          console.error('❌ [IMPRIMIR-QR] Formato de respuesta no reconocido:', response);
          return [];
        }
        

        return alumnos;
      }),
      catchError(error => {
        console.error('❌ [IMPRIMIR-QR] Error al cargar alumnos:', error);
        return of([]);
      })
    ).subscribe(alumnos => {
      // Filtrar solo alumnos que tienen codigo_qr
      this.alumnos = alumnos.filter(a => a.codigo_qr && a.codigo_qr.trim() !== '');
      this.buscando = false;

      this.cd.markForCheck();
    });
  }

  // Buscar alumno específico por código
  buscarAlumnoPorCodigo(codigo: string) {
    if (!codigo || codigo.length !== 14) return;

    this.buscando = true;
    this.cd.markForCheck();

    this.http.get<Alumno>(`${environment.apiUrl}/alumnos/codigo/${codigo}`).pipe(
      catchError(error => {
        console.error('Error al buscar alumno:', error);
        return of(null);
      })
    ).subscribe(alumno => {
      this.buscando = false;
      if (alumno && alumno.codigo_qr) {
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
    this.cd.markForCheck();
  }

  // Obtener alumnos filtrados
  get alumnosFiltrados(): Alumno[] {
    let filtrados = [...this.alumnos];
    
    const searchTerm = this.searchControl.value.toLowerCase().trim();
    if (searchTerm) {
      filtrados = filtrados.filter(alumno =>
        alumno.codigo.toLowerCase().includes(searchTerm) ||
        alumno.nombre.toLowerCase().includes(searchTerm) ||
        alumno.apellido.toLowerCase().includes(searchTerm) ||
        alumno.dni_alumno.includes(searchTerm)
      );
    }

    if (this.nivelFiltro) {
      filtrados = filtrados.filter(alumno => alumno.nivel === this.nivelFiltro);
    }

    if (this.gradoFiltro) {
      filtrados = filtrados.filter(alumno => alumno.grado.toString() === this.gradoFiltro);
    }

    if (this.seccionFiltro) {
      filtrados = filtrados.filter(alumno => alumno.seccion === this.seccionFiltro);
    }

    // NUEVO FILTRO POR TURNO
    if (this.turnoFiltro) {
      filtrados = filtrados.filter(alumno => 
        alumno.turno && alumno.turno.turno.toLowerCase() === this.turnoFiltro.toLowerCase()
      );
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
      filtrados.forEach(alumno => {
        this.alumnosSeleccionados.delete(alumno.id_alumno);
      });
    } else {
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

  // Generar URL del código QR con mejor calidad
  generarUrlQR(codigoQR: string, tamaño: number = 200): string {
    // Usar qr-server con mejor configuración para PDF
    return `https://api.qrserver.com/v1/create-qr-code/?size=${tamaño}x${tamaño}&data=${encodeURIComponent(codigoQR)}&format=png&ecc=M&margin=1`;
  }

  // Convertir imagen URL a Base64
  private async urlToBase64(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        ctx?.drawImage(img, 0, 0);
        
        try {
          const dataURL = canvas.toDataURL('image/png');
          resolve(dataURL);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error(`No se pudo cargar la imagen: ${url}`));
      };
      
      img.src = url;
    });
  }

  // Pre-cargar y convertir todas las imágenes QR a Base64
  private async precargarImagenesQRBase64(): Promise<Map<string, string>> {
    const imagenesBase64 = new Map<string, string>();
    
    for (let i = 0; i < this.alumnosParaImprimir.length; i++) {
      const alumno = this.alumnosParaImprimir[i];
      try {
        const url = this.generarUrlQR(alumno.codigo_qr, this.tamanoNumericoQR);
        
        const base64 = await this.urlToBase64(url);
        imagenesBase64.set(alumno.codigo_qr, base64);
        
      } catch (error) {
        // Generar un QR de fallback o continuar sin esta imagen
      }
    }
    
    return imagenesBase64;
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

  // Generar PDF con imágenes Base64
  async generarPDF() {
    if (this.alumnosSeleccionados.size === 0) {
      alert('Seleccione al menos un alumno para generar el PDF');
      return;
    }

    this.generandoPDF = true;
    this.cd.markForCheck();

    try {
      // 1. Convertir todas las imágenes QR a Base64

      const imagenesBase64 = await this.precargarImagenesQRBase64();

      // 2. Crear PDF directamente con jsPDF (sin html2canvas)

      
      const pdf = new jsPDF({
        orientation: this.orientacionPagina,
        unit: 'mm',
        format: this.tamanoPagina
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margen = 10;
      
      await this.generarContenidoPDF(pdf, imagenesBase64, pdfWidth, pdfHeight, margen);

      // 3. Agregar información adicional
      const fecha = new Date().toLocaleDateString('es-PE');
      const hora = new Date().toLocaleTimeString('es-PE');
      
      pdf.setFontSize(8);
      pdf.setTextColor(128);
      pdf.text(`Generado: ${fecha} ${hora}`, margen, pdfHeight - 10);
      pdf.text(`Total de estudiantes: ${this.alumnosParaImprimir.length}`, margen, pdfHeight - 5);

      // 4. Descargar PDF
      const nombreArchivo = `codigos_qr_${fecha.replace(/\//g, '-')}_${this.alumnosParaImprimir.length}_estudiantes.pdf`;
      pdf.save(nombreArchivo);



    } catch (error) {
      console.error('💥 Error generando PDF:', error);
    } finally {
      this.generandoPDF = false;
      this.cd.markForCheck();
    }
  }

  // Generar contenido del PDF según el formato seleccionado
  private async generarContenidoPDF(
    pdf: jsPDF, 
    imagenesBase64: Map<string, string>, 
    pdfWidth: number, 
    pdfHeight: number, 
    margen: number
  ): Promise<void> {
    const alumnos = this.alumnosParaImprimir;
    
    switch (this.formatoImpresion) {
      case 'etiquetas':
        await this.generarFormatoEtiquetas(pdf, alumnos, imagenesBase64, pdfWidth, pdfHeight, margen);
        break;
      case 'lista':
        await this.generarFormatoLista(pdf, alumnos, imagenesBase64, pdfWidth, pdfHeight, margen);
        break;
      case 'individual':
        await this.generarFormatoIndividual(pdf, alumnos, imagenesBase64, pdfWidth, pdfHeight, margen);
        break;
    }
  }

  // Formato Etiquetas
  private async generarFormatoEtiquetas(
    pdf: jsPDF, 
    alumnos: Alumno[], 
    imagenesBase64: Map<string, string>, 
    pdfWidth: number, 
    pdfHeight: number, 
    margen: number
  ): Promise<void> {
    const columnas = this.columnasPorFila;
    const anchoCelda = (pdfWidth - margen * 2) / columnas;
    const altoCelda = 60;
    const tamanoQR = 35;
    
    let x = margen;
    let y = margen;
    
    for (let i = 0; i < alumnos.length; i++) {
      const alumno = alumnos[i];
      const qrBase64 = imagenesBase64.get(alumno.codigo_qr);
      
      // Dibujar borde de celda
      pdf.setDrawColor(200);
      pdf.rect(x, y, anchoCelda - 2, altoCelda);
      
      if (qrBase64) {
        // Agregar QR
        const qrX = x + (anchoCelda - tamanoQR) / 2;
        const qrY = y + 5;
        pdf.addImage(qrBase64, 'PNG', qrX, qrY, tamanoQR, tamanoQR);
      }
      
      // Agregar texto
      pdf.setFontSize(8);
      pdf.setTextColor(0);
      const textY = y + tamanoQR + 10;
      
      // Nombre
      pdf.setFont('helvetica', 'bold');
      const nombreTexto = `${alumno.nombre} ${alumno.apellido}`;
      const nombreRecortado = nombreTexto.length > 25 ? nombreTexto.substring(0, 22) + '...' : nombreTexto;
      pdf.text(nombreRecortado, x + anchoCelda/2, textY, { align: 'center' });
      
      // Código
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.text(alumno.codigo, x + anchoCelda/2, textY + 4, { align: 'center' });
      
      // Nivel y grado
      pdf.text(`${alumno.nivel} - ${alumno.grado}° ${alumno.seccion}`, x + anchoCelda/2, textY + 8, { align: 'center' });
      
      // Mover a siguiente posición
      x += anchoCelda;
      if ((i + 1) % columnas === 0) {
        x = margen;
        y += altoCelda + 5;
        
        // Nueva página si es necesario
        if (y + altoCelda > pdfHeight - 20) {
          pdf.addPage();
          y = margen;
        }
      }
    }
  }

  // Formato Lista
  private async generarFormatoLista(
    pdf: jsPDF, 
    alumnos: Alumno[], 
    imagenesBase64: Map<string, string>, 
    pdfWidth: number, 
    pdfHeight: number, 
    margen: number
  ): Promise<void> {
    const altoFila = 30;
    const tamanoQR = 20;
    let y = margen;
    
    for (const alumno of alumnos) {
      const qrBase64 = imagenesBase64.get(alumno.codigo_qr);
      
      // Dibujar borde
      pdf.setDrawColor(200);
      pdf.rect(margen, y, pdfWidth - margen * 2, altoFila);
      
      if (qrBase64) {
        // Agregar QR
        pdf.addImage(qrBase64, 'PNG', margen + 5, y + 5, tamanoQR, tamanoQR);
      }
      
      // Agregar información
      const textX = margen + tamanoQR + 10;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${alumno.nombre} ${alumno.apellido}`, textX, y + 8);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.text(`Código: ${alumno.codigo}`, textX, y + 14);
      pdf.text(`DNI: ${alumno.dni_alumno}`, textX, y + 18);
      pdf.text(`${alumno.nivel} - ${alumno.grado}° ${alumno.seccion} - ${alumno.turno.turno}`, textX, y + 22);
      
      y += altoFila + 5;
      
      // Nueva página si es necesario
      if (y + altoFila > pdfHeight - 20) {
        pdf.addPage();
        y = margen;
      }
    }
  }

  // Formato Individual
  private async generarFormatoIndividual(
    pdf: jsPDF, 
    alumnos: Alumno[], 
    imagenesBase64: Map<string, string>, 
    pdfWidth: number, 
    pdfHeight: number, 
    margen: number
  ): Promise<void> {
    const tamanoQR = 80;
    
    for (let i = 0; i < alumnos.length; i++) {
      if (i > 0) pdf.addPage();
      
      const alumno = alumnos[i];
      const qrBase64 = imagenesBase64.get(alumno.codigo_qr);
      
      const centerX = pdfWidth / 2;
      let currentY = margen + 20;
      
      if (qrBase64) {
        // QR centrado
        const qrX = (pdfWidth - tamanoQR) / 2;
        pdf.addImage(qrBase64, 'PNG', qrX, currentY, tamanoQR, tamanoQR);
        currentY += tamanoQR + 15;
      }
      
      // Información centrada
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${alumno.nombre} ${alumno.apellido}`, centerX, currentY, { align: 'center' });
      currentY += 10;
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(alumno.codigo, centerX, currentY, { align: 'center' });
      currentY += 8;
      
      pdf.text(`${alumno.nivel} - ${alumno.grado}° ${alumno.seccion}`, centerX, currentY, { align: 'center' });
      currentY += 6;
      
      pdf.setFontSize(10);
      pdf.text(`Turno: ${alumno.turno.turno}`, centerX, currentY, { align: 'center' });
      currentY += 10;
      
      pdf.setFontSize(8);
      pdf.setTextColor(128);
      pdf.text(alumno.codigo_qr, centerX, currentY, { align: 'center' });
    }
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
    this.turnoFiltro = ''; // LIMPIAR NUEVO FILTRO
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
      case 'small': return 200;
      case 'large': return 400;
      default: return 300;
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
    
    // Estadísticas por turno
    const filtradosPorTurno = this.alumnosFiltrados.reduce((acc, alumno) => {
      const turno = alumno.turno?.turno?.toLowerCase() || 'sin_turno';
      acc[turno] = (acc[turno] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      total,
      seleccionados,
      filtrados,
      porcentajeSeleccion: total > 0 ? Math.round((seleccionados / total) * 100) : 0,
      manana: filtradosPorTurno['mañana'] || 0,
      tarde: filtradosPorTurno['tarde'] || 0
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

  // Obtener clases de grid según formato y columnas
  get clasesGridPDF(): string {
    if (this.formatoImpresion !== 'etiquetas') return '';
    
    switch (this.columnasPorFila) {
      case 2: return 'pdf-grid-2';
      case 3: return 'pdf-grid-3';
      case 4: return 'pdf-grid-4';
      default: return 'pdf-grid-3';
    }
  }

  // Obtener estilos CSS inline para el grid
  get estilosGridPDF(): string {
    if (this.formatoImpresion !== 'etiquetas') return '';
    
    switch (this.columnasPorFila) {
      case 2: return 'display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;';
      case 3: return 'display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;';
      case 4: return 'display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;';
      default: return 'display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;';
    }
  }
}