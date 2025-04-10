import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormLayoutComponent } from "../../components/form-login/form-layout/form-layout.component";
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'gestion-auth-login',
  standalone: true,
  imports: [FormLayoutComponent, HttpClientModule],
  templateUrl: './login.component.html',
  styles: ``,

})
export class LoginPageComponent {

  private background = signal({
    image: 'assets/front-page/front-page-ar.jpg',
    alt: 'background-colegio'
  });

  get getBackground() {
    return this.background;
  }

}
