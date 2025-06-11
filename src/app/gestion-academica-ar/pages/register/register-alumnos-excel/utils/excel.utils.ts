import { AlumnoModuleExcel, NivelEducativoExcel, SeccionExcelEnum } from "../models/alumno-excel.model";



export class ExcelUtils {
  
  static formatearFecha(fecha: Date | string, formato: 'dd/MM/yyyy' | 'yyyy-MM-dd' = 'dd/MM/yyyy'): string {
    const d = new Date(fecha);
    
    const dia = d.getDate().toString().padStart(2, '0');
    const mes = (d.getMonth() + 1).toString().padStart(2, '0');
    const anio = d.getFullYear();
    
    switch (formato) {
      case 'dd/MM/yyyy':
        return `${dia}/${mes}/${anio}`;
      case 'yyyy-MM-dd':
        return `${anio}-${mes}-${dia}`;
      default:
        return `${dia}/${mes}/${anio}`;
    }
  }

  static generarCodigoAlumno(indice: number): string {
    return `ALU${indice.toString().padStart(4, '0')}`;
  }

  static generarNombreUsuario(nombre: string, apellido: string): string {
    const nombreLimpio = nombre.toLowerCase().charAt(0);
    const apellidoLimpio = apellido.toLowerCase().replace(/\s/g, '');
    return `${nombreLimpio}${apellidoLimpio}`;
  }

  static generarPasswordDefault(dni: string, seccion: string): string {
    return `${dni}${seccion}`;
  }

  static validarDatosAlumno(alumno: Partial<AlumnoModuleExcel>): string[] {
    const errores: string[] = [];
    
    if (!alumno.dni_alumno) errores.push('DNI requerido');
    if (!alumno.nombre) errores.push('Nombre requerido');
    if (!alumno.apellido) errores.push('Apellido requerido');
    if (!alumno.nivel) errores.push('Nivel requerido');
    if (!alumno.grado) errores.push('Grado requerido');
    if (!alumno.seccion) errores.push('Sección requerida');
    
    // Validaciones adicionales
    if (alumno.dni_alumno && !/^\d{8}$/.test(alumno.dni_alumno)) {
      errores.push('DNI debe tener 8 dígitos');
    }
    
    if (alumno.grado && (alumno.grado < 1 || alumno.grado > 6)) {
      errores.push('Grado debe estar entre 1 y 6');
    }
    
    return errores;
  }

  static obtenerNivelesEducativos(): NivelEducativoExcel[] {
    return Object.values(NivelEducativoExcel);
  }

  static obtenerSecciones(): SeccionExcelEnum[] {
    return Object.values(SeccionExcelEnum);
  }

  static obtenerGradosPorNivel(nivel: NivelEducativoExcel): number[] {
    switch (nivel) {
      case NivelEducativoExcel.INICIAL:
        return [1, 2, 3];
      case NivelEducativoExcel.PRIMARIA:
        return [1, 2, 3, 4, 5, 6];
      case NivelEducativoExcel.SECUNDARIA:
        return [1, 2, 3, 4, 5];
      default:
        return [];
    }
  }

  static calcularEdad(fechaNacimiento: Date | string): number {
    const nacimiento = new Date(fechaNacimiento);
    const hoy = new Date();
    
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const diferenciaFecha = hoy.getMonth() - nacimiento.getMonth();
    
    if (diferenciaFecha < 0 || (diferenciaFecha === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    
    return edad;
  }

  static formatearNumeroConSeparadores(numero: number): string {
    return numero.toLocaleString('es-PE');
  }

  static obtenerColorPorNivel(nivel: NivelEducativoExcel): string {
    switch (nivel) {
      case NivelEducativoExcel.INICIAL:
        return 'bg-yellow-100 text-yellow-800';
      case NivelEducativoExcel.PRIMARIA:
        return 'bg-green-100 text-green-800';
      case NivelEducativoExcel.SECUNDARIA:
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}