// src/app/gestion-academica-ar/pages/register/list-alumnos/detalle-alumno-dialog.component.ts

import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { AlumnoEstado } from '../../../gestion-academica-ar/pages/register/listAlumnos/listAlumnos.component';


@Component({
  standalone: true,
  selector: 'app-detalle-alumno-dialog',
  imports: [CommonModule, MatDialogModule],
  template: `
    <div class="bg-white rounded-xl shadow-lg w-full max-w-lg">

      <!-- Cabecera clara -->
      <header class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h2 class="text-xl font-semibold text-gray-800">
          {{ data.nombre }} {{ data.apellido }}
        </h2>
        <span
          class="px-3 py-0.5 rounded-full text-xs font-semibold"
          [ngClass]="{
            'bg-green-100 text-green-800': data.estado_actual.estado === 'activo',
            'bg-red-100  text-red-800' : data.estado_actual.estado !== 'activo'
          }"
        >
          {{ data.estado_actual.estado | titlecase }}
        </span>
      </header>

      <!-- Contenido -->
      <section class="px-6 py-5 space-y-5 text-gray-700 text-sm">

        <!-- Datos generales -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
          <p><span class="font-medium">Código:</span> {{ data.codigo }}</p>
          <p><span class="font-medium">DNI:</span> {{ data.dni_alumno }}</p>
          <p class="sm:col-span-2">
            <span class="font-medium">Nivel / Grado / Sección:</span>
            {{ data.nivel }} — {{ data.grado }}° "{{ data.seccion }}"
          </p>
          <p><span class="font-medium">Turno:</span> {{ data.turno.turno }}</p>
          <p>
            <span class="font-medium">Actualizado:</span>
            {{ data.estado_actual.fecha_actualizacion | date:'medium' }}
          </p>
        </div>

        <!-- Divider -->
        <hr class="border-gray-200" />

        <!-- Más información -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
          <p class="sm:col-span-2">
            <span class="font-medium">Observación:</span>
            {{ data.estado_actual.observacion || '—' }}
          </p>
          <p><span class="font-medium">Código QR:</span> {{ data.codigo_qr || '—' }}</p>
          <p><span class="font-medium">Fecha Nac.:</span> {{ data.fecha_nacimiento | date:'mediumDate' }}</p>
          <p class="sm:col-span-2"><span class="font-medium">Dirección:</span> {{ data.direccion }}</p>
          <p class="sm:col-span-2">
            <span class="font-medium">Usuario Registro:</span>
            {{ data.usuario.nombre_usuario }} ({{ data.usuario.rol_usuario }})
          </p>
        </div>
      </section>

      <!-- Acciones -->
      <footer class="px-6 py-3 border-t border-gray-200 flex justify-end">
        <button
          mat-dialog-close
          class="px-4 py-1.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          cdkFocusInitial
        >
          Cerrar
        </button>
      </footer>
    </div>
  `,
})
export class DetalleAlumnoDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: AlumnoEstado) {}
}
