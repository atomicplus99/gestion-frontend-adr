import { Component, Input, signal } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'gestion-form-button',
  imports: [HttpClientModule],
  templateUrl: './form-button.component.html',

})
export class FormButtonComponent {

   seTtext = signal('');
   isEnabled = signal(false);

  @Input({required: true})
  set text(text:string){
    this.seTtext.set(text);
  }

  @Input({required: true})
  set setEnabled(value:boolean){
    this.isEnabled.set(value);
  }





}
