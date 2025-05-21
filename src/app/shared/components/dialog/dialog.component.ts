import { Component, Inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { AlumnoEstado } from '../../../gestion-academica-ar/pages/register/listAlumnos/models/AlumnoEstado.model';


@Component({
  standalone: true,
  selector: 'app-detalle-alumno-dialog',
  imports: [CommonModule, MatDialogModule],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(10px)' }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(100%)' }),
        animate('400ms ease-out', style({ transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'translateX(100%)' }))
      ])
    ])
  ],
  template: `
    <div class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4"
         [@fadeInOut] (click)="closeOnBackdrop($event)">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden text-gray-800 relative"
           [@slideIn]>
        
        <!-- Cabecera con foto de perfil (placeholder) -->
        <header class="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-full bg-white flex items-center justify-center overflow-hidden border-2 border-white shadow-lg">
              <svg class="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
            </div>
            <div>
              <h2 class="text-xl font-bold tracking-tight">
                {{ data.nombre }} {{ data.apellido }}
              </h2>
              <p class="text-sm text-blue-100">{{ data.codigo }} · {{ data.dni_alumno }}</p>
            </div>
          </div>
          <div class="flex flex-col items-end">
            <span
              class="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm"
              [ngClass]="{
                'bg-emerald-100 text-emerald-800': data.estado_actual.estado === 'activo',
                'bg-red-100 text-red-800': data.estado_actual.estado !== 'activo'
              }"
            >
              {{ data.estado_actual.estado | titlecase }}
            </span>
            <span class="text-xs mt-1 text-blue-100">
              Actualizado: {{ data.estado_actual.fecha_actualizacion | date:'dd/MM/yyyy' }}
            </span>
          </div>
        </header>

        <!-- Tabs para secciones -->
        <div class="bg-gray-50 px-6 border-b border-gray-200">
          <div class="flex space-x-4">
            <button 
              (click)="activeTab = 'info'" 
              class="py-3 px-1 text-sm font-medium border-b-2 transition-colors"
              [ngClass]="activeTab === 'info' ? 'border-blue-500 text-blue-600' : 'border-transparent hover:border-gray-300 text-gray-600'"
            >
              Información General
            </button>
            <button 
              (click)="activeTab = 'preview'" 
              class="py-3 px-1 text-sm font-medium border-b-2 transition-colors flex items-center gap-1"
              [ngClass]="activeTab === 'preview' ? 'border-blue-500 text-blue-600' : 'border-transparent hover:border-gray-300 text-gray-600'"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Vista Previa PDF
            </button>
          </div>
        </div>

        <!-- Contenido del detalle -->
        <div class="max-h-[calc(100vh-260px)] overflow-y-auto">
          <!-- Información del alumno -->
          <section *ngIf="activeTab === 'info'" [@fadeInOut] class="px-6 py-5">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <!-- Datos académicos -->
              <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
                <h3 class="font-medium text-blue-600 flex items-center gap-2 mb-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Datos Académicos
                </h3>
                <div class="space-y-3 text-sm">
                  <div class="flex gap-2">
                    <div class="min-w-[100px] text-gray-500">Nivel:</div>
                    <div class="font-medium">{{ data.nivel }}</div>
                  </div>
                  <div class="flex gap-2">
                    <div class="min-w-[100px] text-gray-500">Grado/Sección:</div>
                    <div class="font-medium">{{ data.grado }}° "{{ data.seccion }}"</div>
                  </div>
                  <div class="flex gap-2">
                    <div class="min-w-[100px] text-gray-500">Turno:</div>
                    <div class="font-medium">{{ data.turno.turno }}</div>
                  </div>
                  <div class="flex gap-2">
                    <div class="min-w-[100px] text-gray-500">Estado:</div>
                    <div class="font-medium">
                      <span class="inline-flex items-center"
                        [ngClass]="{
                          'text-emerald-600': data.estado_actual.estado === 'activo',
                          'text-red-600': data.estado_actual.estado !== 'activo'
                        }">
                        <span class="w-2 h-2 rounded-full mr-1.5"
                          [ngClass]="{
                            'bg-emerald-500': data.estado_actual.estado === 'activo',
                            'bg-red-500': data.estado_actual.estado !== 'activo'
                          }"></span>
                        {{ data.estado_actual.estado | titlecase }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Datos personales -->
              <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
                <h3 class="font-medium text-blue-600 flex items-center gap-2 mb-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Datos Personales
                </h3>
                <div class="space-y-3 text-sm">
                  <div class="flex gap-2">
                    <div class="min-w-[100px] text-gray-500">DNI:</div>
                    <div class="font-medium">{{ data.dni_alumno }}</div>
                  </div>
                  <div class="flex gap-2">
                    <div class="min-w-[100px] text-gray-500">Código QR:</div>
                    <div class="font-medium">{{ data.codigo_qr || '—' }}</div>
                  </div>
                  <div class="flex gap-2">
                    <div class="min-w-[100px] text-gray-500">Fecha Nac.:</div>
                    <div class="font-medium">{{ data.fecha_nacimiento | date:'dd/MM/yyyy' }}</div>
                  </div>
                  <div class="flex gap-2">
                    <div class="min-w-[100px] text-gray-500">Dirección:</div>
                    <div class="font-medium">{{ data.direccion }}</div>
                  </div>
                </div>
              </div>

              <!-- Observación -->
              <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-5 sm:col-span-2">
                <h3 class="font-medium text-blue-600 flex items-center gap-2 mb-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  Observación
                </h3>
                <p class="text-sm mt-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  {{ data.estado_actual.observacion || 'No hay observaciones registradas.' }}
                </p>
              </div>

              <!-- Información de registro -->
              <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-5 sm:col-span-2">
                <h3 class="font-medium text-blue-600 flex items-center gap-2 mb-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                  </svg>
                  Información de Registro
                </h3>
                <div class="text-sm mt-2 flex items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div class="mr-3 flex-shrink-0">
                    <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      {{ getUserInitials(data.usuario.nombre_usuario) }}
                    </div>
                  </div>
                  <div>
                    <div class="font-medium">{{ data.usuario.nombre_usuario }}</div>
                    <div class="text-xs text-gray-500">{{ data.usuario.rol_usuario }}</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Vista previa del PDF -->
          <section *ngIf="activeTab === 'preview'" [@fadeInOut] class="px-6 py-5">
            <div class="bg-gray-100 rounded-xl border border-gray-200 p-5">
              <div #pdfContent class="bg-white shadow-lg rounded-lg p-6 mx-auto max-w-2xl">
                <!-- Encabezado del PDF -->
                <div class="border-b border-gray-200 pb-4 mb-4 flex justify-between items-center">
                  <div class="flex items-center gap-3">
                    <div class="bg-blue-500 text-white p-2 rounded-full">
                      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                      </svg>
                    </div>
                    <div>
                      <h2 class="text-lg font-bold text-gray-800">{{ data.nombre }} {{ data.apellido }}</h2>
                      <p class="text-sm text-gray-500">{{ data.codigo }} · {{ data.dni_alumno }}</p>
                    </div>
                  </div>
                  <div>
                    <span
                      class="px-3 py-1 rounded-full text-xs font-bold uppercase"
                      [ngClass]="{
                        'bg-emerald-100 text-emerald-800': data.estado_actual.estado === 'activo',
                        'bg-red-100 text-red-800': data.estado_actual.estado !== 'activo'
                      }"
                    >
                      {{ data.estado_actual.estado | titlecase }}
                    </span>
                  </div>
                </div>

                <!-- Contenido del PDF -->
                <div class="grid grid-cols-2 gap-4 mb-4">
                  <div class="col-span-2">
                    <h3 class="text-sm font-semibold text-gray-600 mb-1">Datos Académicos</h3>
                    <div class="border border-gray-200 rounded-lg p-3 bg-gray-50">
                      <div class="grid grid-cols-2 gap-2 text-sm">
                        <p><span class="text-gray-500">Nivel:</span> {{ data.nivel }}</p>
                        <p><span class="text-gray-500">Grado/Sección:</span> {{ data.grado }}° "{{ data.seccion }}"</p>
                        <p><span class="text-gray-500">Turno:</span> {{ data.turno.turno }}</p>
                        <p><span class="text-gray-500">Actualizado:</span> {{ data.estado_actual.fecha_actualizacion | date:'dd/MM/yyyy' }}</p>
                      </div>
                    </div>
                  </div>

                  <div class="col-span-2">
                    <h3 class="text-sm font-semibold text-gray-600 mb-1">Datos Personales</h3>
                    <div class="border border-gray-200 rounded-lg p-3 bg-gray-50">
                      <div class="grid grid-cols-2 gap-2 text-sm">
                        <p><span class="text-gray-500">DNI:</span> {{ data.dni_alumno }}</p>
                        <p><span class="text-gray-500">Código QR:</span> {{ data.codigo_qr || '—' }}</p>
                        <p><span class="text-gray-500">Fecha Nac.:</span> {{ data.fecha_nacimiento | date:'dd/MM/yyyy' }}</p>
                        <p class="col-span-2"><span class="text-gray-500">Dirección:</span> {{ data.direccion }}</p>
                      </div>
                    </div>
                  </div>

                  <div class="col-span-2">
                    <h3 class="text-sm font-semibold text-gray-600 mb-1">Observación</h3>
                    <div class="border border-gray-200 rounded-lg p-3 bg-gray-50 text-sm">
                      {{ data.estado_actual.observacion || 'No hay observaciones registradas.' }}
                    </div>
                  </div>
                </div>

                <!-- Pie de página del PDF -->
                <div class="border-t border-gray-200 pt-4 flex justify-between items-center text-xs text-gray-500">
                  <div>Generado por: {{ data.usuario.nombre_usuario }} ({{ data.usuario.rol_usuario }})</div>
                  <div>Fecha de impresión: {{ today | date:'dd/MM/yyyy HH:mm' }}</div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- Footer con botones de acción -->
        <footer class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div>
            <button
              (click)="activeTab = 'info'"
              class="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 mr-2"
            >
              Volver a Información
            </button>
          </div>
          
          <div class="flex items-center gap-3">
            <button
              (click)="printAsPDF()"
              class="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 shadow-sm flex items-center gap-2 transition-all duration-200 hover:shadow-md"
              [ngClass]="{'animate-pulse': isGeneratingPdf}"
            >
              <svg *ngIf="!isGeneratingPdf" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <svg *ngIf="isGeneratingPdf" class="w-5 h-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isGeneratingPdf ? 'Generando...' : 'Descargar PDF' }}
            </button>

            <button
              (click)="dialogRef.close()"
              class="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm"
            >
              Cerrar
            </button>
          </div>
        </footer>

        <!-- Notificación de éxito -->
        <div *ngIf="showSuccessNotification" 
             class="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in-up">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          PDF generado con éxito
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .animate-fade-in-up {
      animation: fadeInUp 0.3s ease-out forwards;
    }
  `]
})
export class DetalleAlumnoDialogComponent implements AfterViewInit {
  @ViewChild('pdfContent') pdfContent!: ElementRef;

  activeTab: 'info' | 'preview' = 'info';
  isGeneratingPdf = false;
  showSuccessNotification = false;
  today = new Date();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AlumnoEstado,
    public dialogRef: MatDialogRef<DetalleAlumnoDialogComponent>
  ) {}

  ngAfterViewInit() {
    // Opcional: Agregar alguna inicialización después de la vista
  }

  closeOnBackdrop(event: MouseEvent) {
    const target = event.target as HTMLElement;
    // Solo cerrar si se hizo clic en el backdrop (fondo)
    if (target.classList.contains('fixed')) {
      this.dialogRef.close();
    }
  }

  getUserInitials(name: string): string {
    if (!name) return '';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  printAsPDF() {
    // Mostrar animación de cargando
    this.isGeneratingPdf = true;
    this.activeTab = 'preview';
    
    // Simular tiempo de procesamiento para mostrar la animación
    setTimeout(() => {
      const printContents = this.pdfContent.nativeElement.innerHTML;
      const popupWindow = window.open('', '_blank', 'width=800,height=600');

      if (popupWindow) {
        popupWindow.document.open();
        popupWindow.document.write(`
          <html>
            <head>
              <title>Detalle de Alumno - ${this.data.nombre} ${this.data.apellido}</title>
              <style>
                @page {
                  size: A4;
                  margin: 1cm;
                }
                body {
                  font-family: 'Segoe UI', Arial, sans-serif;
                  color: #333;
                  line-height: 1.5;
                }
                h2 {
                  margin-bottom: 10px;
                  color: #2563eb;
                }
                .rounded-full {
                  border-radius: 9999px;
                }
                .bg-emerald-100 {
                  background-color: #d1fae5;
                }
                .text-emerald-800 {
                  color: #065f46;
                }
                .bg-red-100 {
                  background-color: #fee2e2;
                }
                .text-red-800 {
                  color: #991b1b;
                }
                .border {
                  border: 1px solid #e5e7eb;
                }
                .rounded-lg {
                  border-radius: 0.5rem;
                }
                .p-3 {
                  padding: 0.75rem;
                }
                .bg-gray-50 {
                  background-color: #f9fafb;
                }
                .grid {
                  display: grid;
                }
                .grid-cols-2 {
                  grid-template-columns: repeat(2, minmax(0, 1fr));
                }
                .gap-2 {
                  gap: 0.5rem;
                }
                .text-sm {
                  font-size: 0.875rem;
                }
                .text-gray-500 {
                  color: #6b7280;
                }
                .text-gray-600 {
                  color: #4b5563;
                }
                .font-semibold {
                  font-weight: 600;
                }
                .col-span-2 {
                  grid-column: span 2 / span 2;
                }
                .border-t, .border-b {
                  border-top: 1px solid #e5e7eb;
                  border-bottom: 1px solid #e5e7eb;
                }
                .pt-4, .pb-4 {
                  padding-top: 1rem;
                  padding-bottom: 1rem;
                }
                .flex {
                  display: flex;
                }
                .justify-between {
                  justify-content: space-between;
                }
                .items-center {
                  align-items: center;
                }
                .text-xs {
                  font-size: 0.75rem;
                }
                .mb-1, .mb-4 {
                  margin-bottom: 0.25rem;
                  margin-bottom: 1rem;
                }
                .px-3, .py-1 {
                  padding-left: 0.75rem;
                  padding-right: 0.75rem;
                  padding-top: 0.25rem;
                  padding-bottom: 0.25rem;
                }
                .text-lg {
                  font-size: 1.125rem;
                }
                .font-bold {
                  font-weight: 700;
                }
                .text-gray-800 {
                  color: #1f2937;
                }
                .gap-3 {
                  gap: 0.75rem;
                }
                .bg-blue-500 {
                  background-color: #3b82f6;
                }
                .text-white {
                  color: white;
                }
                .p-2 {
                  padding: 0.5rem;
                }
                .p-6 {
                  padding: 1.5rem;
                }
                .shadow-lg {
                  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                }
                .max-w-2xl {
                  max-width: 42rem;
                }
                .mx-auto {
                  margin-left: auto;
                  margin-right: auto;
                }
              </style>
            </head>
            <body onload="setTimeout(() => { window.print(); window.close(); }, 500)">
              ${printContents}
            </body>
          </html>
        `);
        popupWindow.document.close();
        
        // Mostrar notificación de éxito
        this.isGeneratingPdf = false;
        this.showSuccessNotification = true;
        
        // Ocultar la notificación después de 3 segundos
        setTimeout(() => {
          this.showSuccessNotification = false;
        }, 3000);
      }
    }, 1000); // Simular procesamiento durante 1 segundo
  }
}
