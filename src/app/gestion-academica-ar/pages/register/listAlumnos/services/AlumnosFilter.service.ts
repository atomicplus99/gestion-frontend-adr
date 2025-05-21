import { Injectable } from '@angular/core';
import { AlumnoEstado } from '../models/AlumnoEstado.model';


@Injectable()
export class AlumnosFiltroService {
  /**
   * Aplica todos los filtros a la lista de alumnos
   */
  aplicarFiltros(datosOriginales: AlumnoEstado[], filtros: {
    texto: string,
    estado: string,
    nivel: string
  }): AlumnoEstado[] {
    let datosFiltrados = [...datosOriginales];

    // Aplicar filtro de estado
    if (filtros.estado) {
      datosFiltrados = this.filtrarPorEstado(datosFiltrados, filtros.estado);
    }

    // Aplicar filtro de nivel
    if (filtros.nivel) {
      datosFiltrados = this.filtrarPorNivel(datosFiltrados, filtros.nivel);
    }

    // Aplicar filtro de texto
    if (filtros.texto) {
      datosFiltrados = this.filtrarPorTexto(datosFiltrados, filtros.texto);
    }

    return datosFiltrados;
  }

  /**
   * Filtra alumnos por estado
   */
  filtrarPorEstado(alumnos: AlumnoEstado[], estado: string): AlumnoEstado[] {
    if (!estado) return alumnos;

    // Convertir a mayúsculas para comparación consistente
    const estadoUpper = estado.toUpperCase();

    return alumnos.filter(alumno => {
      const estadoAlumno = alumno.estado_actual?.estado || '';
      return estadoAlumno.toUpperCase() === estadoUpper;
    });
  }

  /**
   * Filtra alumnos por nivel
   */
  filtrarPorNivel(alumnos: AlumnoEstado[], nivel: string): AlumnoEstado[] {
    return alumnos.filter(alumno => {
      return alumno.nivel === nivel;
    });
  }

  /**
   * Filtra alumnos por texto en cualquier campo
   */
  filtrarPorTexto(alumnos: AlumnoEstado[], texto: string): AlumnoEstado[] {
    const textoFiltro = texto.trim().toUpperCase();

    return alumnos.filter(alumno => {
      const textoBusqueda = [
        alumno.codigo || '',
        alumno.dni_alumno || '',
        alumno.nombre || '',
        alumno.apellido || '',
        alumno.nivel || '',
        alumno.turno?.turno || '',
        alumno.usuario?.nombre_usuario || '',
        alumno.estado_actual?.estado || ''
      ].join(' ');

      return textoBusqueda.includes(textoFiltro);
    });
  }

  /**
   * Ordena la lista de alumnos según columna y dirección
   */
  ordenarAlumnos(datos: AlumnoEstado[], columna: string, direccion: 'asc' | 'desc'): AlumnoEstado[] {
    const isAsc = direccion === 'asc';

    return [...datos].sort((a, b) => {
      switch (columna) {
        case 'codigo': return this.comparar(a.codigo, b.codigo, isAsc);
        case 'dni_alumno': return this.comparar(a.dni_alumno, b.dni_alumno, isAsc);
        case 'nombre': return this.comparar(a.nombre, b.nombre, isAsc);
        case 'apellido':
          // Ordenar primero por apellido y luego por nombre
          const apellidoComp = this.comparar(a.apellido, b.apellido, isAsc);
          if (apellidoComp === 0) {
            return this.comparar(a.nombre, b.nombre, isAsc);
          }
          return apellidoComp;
        case 'nivel': return this.comparar(a.nivel, b.nivel, isAsc);
        case 'grado': return this.comparar(a.grado, b.grado, isAsc);
        case 'seccion': return this.comparar(a.seccion, b.seccion, isAsc);
        case 'turno': return this.comparar(a.turno?.turno, b.turno?.turno, isAsc);
        case 'usuario': return this.comparar(a.usuario?.nombre_usuario, b.usuario?.nombre_usuario, isAsc);
        case 'estado': return this.comparar(a.estado_actual?.estado, b.estado_actual?.estado, isAsc);
        case 'fecha_actualizacion': return this.comparar(a.estado_actual?.fecha_actualizacion, b.estado_actual?.fecha_actualizacion, isAsc);
        default: return 0;
      }
    });
  }

  /**
   * Función auxiliar para comparar valores
   */
  private comparar(a: any, b: any, isAsc: boolean): number {
    // Manejar valores nulos o undefined
    if (!a && !b) return 0;
    if (!a) return isAsc ? -1 : 1;
    if (!b) return isAsc ? 1 : -1;

    // Para fechas
    if (typeof a === 'string' && a.match(/^\d{4}-\d{2}-\d{2}/) &&
      typeof b === 'string' && b.match(/^\d{4}-\d{2}-\d{2}/)) {
      return (new Date(a).getTime() - new Date(b).getTime()) * (isAsc ? 1 : -1);
    }

    // Para strings, usar localeCompare para ordenamiento alfabético correcto
    if (typeof a === 'string' && typeof b === 'string') {
      return a.localeCompare(b, undefined, { sensitivity: 'base' }) * (isAsc ? 1 : -1);
    }

    // Para números y otros tipos
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }
}