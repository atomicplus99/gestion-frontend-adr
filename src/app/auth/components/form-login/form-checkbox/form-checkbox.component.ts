import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'gestion-form-checkbox',
  imports: [ReactiveFormsModule, HttpClientModule],
  templateUrl: './form-checkbox.component.html',
  styles: ``
})
export class FormCheckboxComponent {

  @Input()
  rememberUserControl!: FormControl; 

  setLabel = signal('');

  @Input({required: true})
  set label(label:string){
    this.setLabel.set(label);
  }

 

}
