import { Component, Input, signal, Signal } from '@angular/core';
import { FormLabelComponent } from "../form-label/form-label.component";
import { IconCheckComponent } from "../../../../shared/components/icon-check/icon-check.component";
import { FormPlaceholderComponent } from "../form-placeholder/form-placeholdercomponent";
import { InputTypes } from '../../../../types/type-form.types';
import { FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

export type TypeForm = {

}

@Component({
  selector: 'gestion-form-field',
  imports: [FormLabelComponent, IconCheckComponent, FormPlaceholderComponent, CommonModule, HttpClientModule],
  templateUrl: './form-field.component.html',
  styles: ``
})
export class FormFieldComponent {



  iconSet = signal(false);
  placeholderSet = signal('');
  labelSet = signal('');
  typeSet = signal<InputTypes>('text');

  @Input({required: true})
  control!: FormControl;

  @Input({required: true})
  set icon(setIcon: boolean){
    this.iconSet.set(setIcon);
  }

  @Input()
  set placeholder(placeholder: string){
    this.placeholderSet.set(placeholder);
  }

  @Input({required: true})
  set label(label: string){
    this.labelSet.set(label);
  }

  @Input({required: true})
  set type(type: InputTypes){
    this.typeSet.set(type);
  }

  getErrorMessage(): string {
    if (this.control.hasError('required')) {
      return 'Este campo es obligatorio.';
    }
  
    if (this.control.hasError('minlength') || this.control.hasError('maxlength')) {
      return 'Debe tener exactamente 8 caracteres.';
    }
  
    return '';
  }



}
