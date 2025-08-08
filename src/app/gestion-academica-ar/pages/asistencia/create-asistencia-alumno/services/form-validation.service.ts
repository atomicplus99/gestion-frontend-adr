import { Injectable } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class FormValidationService {
  
  getValidationClass(control: AbstractControl | null, isOptional: boolean = false): string {
    if (!control) return 'w-3 h-3 bg-gray-300 rounded-full';

    if (isOptional && !control.value) {
      return 'w-3 h-3 bg-gray-300 rounded-full';
    }

    if (control.valid && control.value) {
      return 'w-3 h-3 bg-green-500 rounded-full';
    } else if (control.invalid && control.touched) {
      return 'w-3 h-3 bg-red-500 rounded-full';
    }
    return 'w-3 h-3 bg-gray-300 rounded-full';
  }

  getCharCountClass(currentLength: number, minLength: number): string {
    if (currentLength < minLength) {
      return 'text-red-600 bg-red-100';
    } else if (currentLength >= minLength) {
      return 'text-green-600 bg-green-100';
    }
    return 'text-gray-400 bg-gray-100';
  }

  getSubmitButtonClass(isValid: boolean, isProcessing: boolean, hasPermissions: boolean): string {
    if (isValid && !isProcessing && hasPermissions) {
      return 'bg-blue-600 hover:bg-blue-700 text-white';
    }
    return 'bg-gray-400 text-gray-600 cursor-not-allowed';
  }

  getFormErrors(form: FormGroup, idAuxiliar: string | null): string[] {
    const errores: string[] = [];
    
    if (form.get('hora_de_llegada')?.invalid) {
      errores.push('• Hora de llegada requerida');
    }
    if (form.get('hora_salida')?.invalid) {
      errores.push('• Formato de hora de salida inválido');
    }
    if (form.get('estado_asistencia')?.invalid) {
      errores.push('• Debe seleccionar PUNTUAL o TARDANZA');
    }
    if (form.get('motivo')?.invalid) {
      const motivo = form.get('motivo')?.value || '';
      if (motivo.length < 10) {
        errores.push(`• Motivo muy corto (${motivo.length}/10 caracteres)`);
      }
    }
    if (!idAuxiliar) {
      errores.push('• No se ha establecido el ID del auxiliar');
    }
    
    return errores;
  }

  markAllFieldsAsTouched(form: FormGroup): void {
    Object.keys(form.controls).forEach(key => {
      form.get(key)?.markAsTouched();
      form.get(key)?.markAsDirty();
    });
  }
}