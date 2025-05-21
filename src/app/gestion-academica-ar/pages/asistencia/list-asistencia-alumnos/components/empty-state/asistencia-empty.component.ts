import { Component, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-asistencia-empty-state',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './asistencia-empty.component.html',
  styleUrls: ['./asistencia-empty.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AsistenciaEmptyStateComponent {
  @Output() refreshData = new EventEmitter<void>();
  
  onRefreshData(): void {
    this.refreshData.emit();
  }
}