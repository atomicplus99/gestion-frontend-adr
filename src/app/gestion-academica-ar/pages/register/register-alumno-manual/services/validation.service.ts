import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class ValidationService {
  
  static validarEdad() {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const fecha = new Date(control.value);
      const hoy = new Date();

      if (isNaN(fecha.getTime())) return null;

      const edad = hoy.getFullYear() - fecha.getFullYear();
      const mes = hoy.getMonth() - fecha.getMonth();
      const dia = hoy.getDate() - fecha.getDate();
      const edadFinal = edad - (mes < 0 || (mes === 0 && dia < 0) ? 1 : 0);

      if (fecha > hoy || edadFinal < 3 || edadFinal > 20) {
        return { edadInvalida: true };
      }

      return null;
    };
  }

  static getErrorMessage(controlName: string, errors: ValidationErrors | null): string {
    if (!errors) return '';

    const errorMessages: { [key: string]: string } = {
      required: 'Este campo es obligatorio.',
      minlength: `Debe tener al menos ${errors['minlength']?.requiredLength} caracteres.`,
      maxlength: `No puede exceder ${errors['maxlength']?.requiredLength} caracteres.`,
      pattern: 'Formato inválido.',
      edadInvalida: 'Edad inválida (debe tener entre 3 y 20 años).'
    };

    const firstError = Object.keys(errors)[0];
    return errorMessages[firstError] || 'Campo inválido.';
  }
}
