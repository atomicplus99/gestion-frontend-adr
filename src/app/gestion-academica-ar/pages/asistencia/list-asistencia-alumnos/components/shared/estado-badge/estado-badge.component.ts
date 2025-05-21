import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-estado-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './estado-badge.component.html',
  styleUrls: ['./estado-badge.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EstadoBadgeComponent {
  @Input() estado: 'PUNTUAL' | 'TARDANZA' | 'AUSENTE' = 'PUNTUAL';
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  
  get iconClass(): string {
    switch (this.estado) {
      case 'PUNTUAL': return 'fa-check-circle';
      case 'TARDANZA': return 'fa-clock';
      case 'AUSENTE': return 'fa-times-circle';
      default: return 'fa-question-circle';
    }
  }
  
  get badgeClass(): string {
    const baseClass = 'status-badge';
    const stateClass = this.estado.toLowerCase();
    const sizeClass = `size-${this.size}`;
    return `${baseClass} ${stateClass} ${sizeClass}`;
  }
}