import { Component, Input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'form-placeholder',
  imports: [ReactiveFormsModule, HttpClientModule, CommonModule],
  templateUrl: './form-placeholder.component.html',

})
export class FormPlaceholderComponent {

  typeInput = signal('');
  textPlaceholder = signal('');
  showPassword = signal(false);

  @Input({ required: true })
  set type(value:string){
    this.typeInput.set(value);
  }

  @Input()
  set placeholder(value:string){
    this.textPlaceholder.set(value);
  }

  @Input({required: true})
  control!: FormControl;

  togglePasswordVisibility(): void {
    this.showPassword.set(!this.showPassword());
  }

  getInputType(): string {
    if (this.typeInput() === 'password') {
      return this.showPassword() ? 'text' : 'password';
    }
    return this.typeInput();
  }

  getEyeIcon(): string {
    return this.showPassword() ? 'eye-slash' : 'eye';
  }
}
