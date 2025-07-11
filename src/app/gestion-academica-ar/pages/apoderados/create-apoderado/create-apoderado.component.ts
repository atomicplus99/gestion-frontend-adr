// components/apoderado-create-form.component.ts
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CreateApoderadoDto } from '../models/ApoderadoDtos';
import { ApoderadoService } from '../apoderado.service';

@Component({
 selector: 'app-apoderado-create-form',
 standalone: true,
 imports: [CommonModule, ReactiveFormsModule],
 templateUrl: './create-apoderado.component.html'
})
export class ApoderadoCreateFormComponent {
 private apoderadoService = inject(ApoderadoService);
 private fb = inject(FormBuilder);
 private router = inject(Router);

 // Signals
 submitting = signal(false);
 successMessage = signal('');
 errorMessage = signal('');

 // Formulario
 apoderadoForm: FormGroup = this.fb.group({
   nombre: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(100)]],
   apellido: ['', [Validators.maxLength(100)]],
   dni: ['', [Validators.minLength(8), Validators.maxLength(8), Validators.pattern(/^\d{8}$/)]],
   email: ['', [Validators.email, Validators.maxLength(100)]],
   telefono: ['', [Validators.maxLength(15)]],
   tipo_relacion: ['', [Validators.required]],
   relacion_especifica: ['', [Validators.maxLength(100)]],
   activo: [true]
 });

 onSubmit(): void {
   if (this.apoderadoForm.valid) {
     this.submitting.set(true);
     this.clearMessages();

     const formData = this.cleanFormData(this.apoderadoForm.value);
     this.createApoderado(formData);
   } else {
     this.markFormGroupTouched();
   }
 }

 createApoderado(data: CreateApoderadoDto): void {
   this.apoderadoService.create(data).subscribe({
     next: (apoderado) => {
       this.submitting.set(false);
       this.successMessage.set('Apoderado creado exitosamente');
       this.resetForm();
     },
     error: (error) => {
       this.submitting.set(false);
       this.handleError(error);
     }
   });
 }

 resetForm(): void {
   this.apoderadoForm.reset();
   this.apoderadoForm.patchValue({ activo: true });
   this.clearMessages();
 }

 goBack(): void {
   this.router.navigate(['/apoderados']);
 }

 private cleanFormData(data: any): any {
   const cleanData: any = {};
   
   Object.keys(data).forEach(key => {
     const value = data[key];
     if (value !== null && value !== undefined && value !== '') {
       cleanData[key] = value;
     }
   });

   return cleanData;
 }

 private markFormGroupTouched(): void {
   Object.keys(this.apoderadoForm.controls).forEach(key => {
     const control = this.apoderadoForm.get(key);
     control?.markAsTouched();
   });
 }

 private clearMessages(): void {
   this.successMessage.set('');
   this.errorMessage.set('');
 }

 private handleError(error: any): void {
   console.error('Error:', error);
   
   if (error.status === 409) {
     this.errorMessage.set('Ya existe un apoderado con este DNI');
   } else if (error.status === 400) {
     this.errorMessage.set('Datos inválidos. Revise la información ingresada');
   } else {
     this.errorMessage.set('Error al procesar la solicitud. Intente nuevamente');
   }
 }
}