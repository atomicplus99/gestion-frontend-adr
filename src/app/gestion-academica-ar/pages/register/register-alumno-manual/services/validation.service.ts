import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class ValidationService {
  


  static getErrorMessage(controlName: string, errors: ValidationErrors | null): string {
    if (!errors) return '';

    const errorMessages: { [key: string]: string } = {
      required: 'Este campo es obligatorio.',
      minlength: `Debe tener al menos ${errors['minlength']?.requiredLength} caracteres.`,
      maxlength: `No puede exceder ${errors['maxlength']?.requiredLength} caracteres.`,
      pattern: 'Formato inválido.'
    };

    const firstError = Object.keys(errors)[0];
    return errorMessages[firstError] || 'Campo inválido.';
  }
}
