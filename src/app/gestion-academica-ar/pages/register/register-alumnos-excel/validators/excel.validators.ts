import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { EXCEL_CONFIG } from '../constants/excel.constants';


export class ExcelValidators {
  
  static dniExcel(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const dni = control.value.toString();
      const isValid = EXCEL_CONFIG.VALIDATION.DNI.PATTERN.test(dni);
      
      return isValid ? null : { invalidDniExcel: { value: control.value } };
    };
  }

  static codigoAlumnoExcel(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const codigo = control.value.toString();
      const isValid = EXCEL_CONFIG.VALIDATION.CODIGO_ALUMNO.PATTERN.test(codigo);
      
      return isValid ? null : { invalidCodigoExcel: { value: control.value } };
    };
  }

  static excelFileType(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const file = control.value as File;
      const allowedTypes = EXCEL_CONFIG.FILE_UPLOAD.EXCEL.ALLOWED_TYPES;
      const isValid = allowedTypes.includes(file.type as any);
      
      return isValid ? null : { invalidExcelFileType: { 
        actualType: file.type, 
        allowedTypes 
      }};
    };
  }

  static excelFileSize(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const file = control.value as File;
      const maxSize = EXCEL_CONFIG.FILE_UPLOAD.EXCEL.MAX_SIZE;
      const isValid = file.size <= maxSize;
      
      return isValid ? null : { excelFileTooLarge: { 
        actualSize: file.size, 
        maxSize 
      }};
    };
  }

  static gradoValido(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const grado = Number(control.value);
      const isValid = grado >= 1 && grado <= 6; // Ajustar según necesidades
      
      return isValid ? null : { gradoInvalidoExcel: { 
        actualGrado: grado 
      }};
    };
  }
}
