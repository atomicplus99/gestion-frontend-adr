import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-terminos-condiciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './terminos-condiciones.component.html',
  styleUrls: ['./terminos-condiciones.component.css']
})
export class TerminosCondicionesComponent {

  constructor(private router: Router) {}

  goBack(): void {
    this.router.navigate(['/home/welcome']);
  }
}
