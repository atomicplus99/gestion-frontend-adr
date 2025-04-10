import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'shared-icon-check',
  imports: [HttpClientModule],
  templateUrl: './icon-check.component.html',
  styleUrl: './icon-check.component.css',

})
export class IconCheckComponent { }
