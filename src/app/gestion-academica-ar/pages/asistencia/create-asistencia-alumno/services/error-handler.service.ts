import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';
import { ErrorResponseManualAsistencia, RegistroAsistenciaRequestManual } from '../models/CreateAsistenciaManual.model';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {

  async mostrarError(titulo: string, mensaje: string): Promise<void> {
    await Swal.fire({
      icon: 'error',
      title: titulo,
      text: mensaje,
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#dc2626'
    });
  }

  async manejarErrorRegistro(
    error: ErrorResponseManualAsistencia, 
    datosRegistro: RegistroAsistenciaRequestManual,
    nombreCompleto: string
  ): Promise<void> {
    let titulo = 'Error al Registrar';
    let mensaje = '';
    
    if (error.status === 400) {
      if (error.error?.message?.includes('ya tiene asistencia registrada')) {
        titulo = 'Asistencia Duplicada';
        mensaje = `El estudiante ${nombreCompleto} ya tiene asistencia registrada para la fecha seleccionada.\n\nPosible registro simultáneo por otro auxiliar o por scanner.`;
      } else if (error.error?.message?.includes('Use la interfaz correspondiente')) {
        titulo = 'Registro Existente';
        mensaje = error.error.message + '\n\n• Para ANULADOS: Use interfaz de actualización\n• Para AUSENTES: Use interfaz de ausencias\n• Para JUSTIFICADOS: Use interfaz de justificaciones';
      } else if (error.error?.message?.includes('hora')) {
        titulo = 'Error en Horarios';
        mensaje = `Las horas ingresadas no son válidas:\n\n• Llegada: ${datosRegistro.hora_de_llegada}\n• Salida: ${datosRegistro.hora_salida || 'No especificada'}\n\nVerifique que estén dentro del turno del estudiante.`;
      } else if (error.error?.message?.includes('debe ser PUNTUAL o TARDANZA')) {
        titulo = 'Estado Inválido';
        mensaje = 'Solo se permiten los estados PUNTUAL y TARDANZA para registro manual.\n\nLos demás estados se manejan en interfaces específicas.';
      } else {
        titulo = 'Datos Inválidos';
        mensaje = error.error?.message || 'Los datos enviados no cumplen las validaciones del servidor.';
      }
    } else if (error.status === 404) {
      titulo = 'Estudiante No Encontrado';
      mensaje = `El estudiante ${nombreCompleto} no se encontró durante el registro.\n\nPosible eliminación después de la verificación.`;
    } else if (error.status === 500) {
      titulo = 'Error del Servidor';
      mensaje = 'Error interno del servidor al procesar el registro.\n\nEl equipo técnico ha sido notificado automáticamente.';
    } else if (error.status === 0) {
      titulo = 'Error de Conexión';
      mensaje = 'Se perdió la conexión durante el registro.\n\n⚠️ Verifique si el registro se completó antes de intentar nuevamente.';
    } else {
      titulo = 'Error Inesperado';
      mensaje = `Error ${error.status}: ${error.error?.message || error.message || 'Error desconocido'}`;
    }
    
    await this.mostrarError(titulo, mensaje);
  }
}
