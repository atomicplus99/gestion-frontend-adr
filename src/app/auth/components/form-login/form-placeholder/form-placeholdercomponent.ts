import { Component, Input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'form-placeholder',
  imports: [ReactiveFormsModule, HttpClientModule],
  templateUrl: './form-placeholder.component.html',

})
export class FormPlaceholderComponent {


  typeInput = signal('');
  textPlaceholder = signal('');

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


}
