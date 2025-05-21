import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-asistencia-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './asistencia-header.component.html',
  styleUrls: ['./asistencia-header.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AsistenciaHeaderComponent {
  @Input() recordCount: number = 0;
  @Output() refreshData = new EventEmitter<void>();
  @Output() exportToCSV = new EventEmitter<void>();
  @Output() markAllPresent = new EventEmitter<void>();

  onRefreshData(): void {
    this.refreshData.emit();
  }

  onExportToCSV(): void {
    this.exportToCSV.emit();
  }

  onMarkAllPresent(): void {
    this.markAllPresent.emit();
  }
}