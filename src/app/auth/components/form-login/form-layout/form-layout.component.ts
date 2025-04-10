import { Component } from '@angular/core';
import { FormContainerComponent } from '../form-container/form-container.component';
import { FormHeaderComponent } from "../form-header/form-header.component";
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'gestion-form-layout',
  imports: [FormContainerComponent, FormHeaderComponent, HttpClientModule],
  templateUrl: './form-layout.component.html',

})
export class FormLayoutComponent {

}
