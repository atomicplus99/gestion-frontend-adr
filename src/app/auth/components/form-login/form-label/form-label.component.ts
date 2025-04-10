import { Component, computed, Input, signal } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'form-label',
  imports: [HttpClientModule],
  templateUrl: './form-label.component.html',

})
export class FormLabelComponent {

  private label = signal('');

  @Input( {required: true} )
  set setLabel( value : string ){
    this.label.set(value);
  }

  get textLabel() { return this.label };



}
