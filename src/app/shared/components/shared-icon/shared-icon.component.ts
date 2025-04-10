import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'shared-icon',
  imports: [CommonModule],
  templateUrl: './shared-icon.component.html',

})
export class SharedIconComponent {
  @Input() name: string = '';
}
