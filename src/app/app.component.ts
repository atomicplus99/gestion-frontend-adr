import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { RouterOutlet } from '@angular/router';


@Component({
  selector: 'app-root',
  imports: [ HttpClientModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  
})
export class AppComponent {



}
