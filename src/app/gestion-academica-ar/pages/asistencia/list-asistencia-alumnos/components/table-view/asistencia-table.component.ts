import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EstadoBadgeComponent } from '../shared/estado-badge/estado-badge.component';
import { AsistenciaRowList } from '../../models/ListAsistencia.model';



@Component({
  selector: 'app-asistencia-table',
  standalone: true,
  imports: [CommonModule, EstadoBadgeComponent],
  templateUrl: './asistencia-table.component.html',
  styleUrls: ['./asistencia-table.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AsistenciaTableComponent {
  @Input() dataSource: AsistenciaRowList[] = [];
  @Input() displayedColumns: string[] = [];
  @Input() sortColumn = 'codigo';
  @Input() sortDirection: 'asc' | 'desc' = 'asc';
  
  @Output() sort = new EventEmitter<string>();
  @Output() markAttendance = new EventEmitter<{row: AsistenciaRowList, status: 'PUNTUAL' | 'TARDANZA' | 'AUSENTE'}>();
  @Output() markExit = new EventEmitter<AsistenciaRowList>();
  @Output() addObservation = new EventEmitter<AsistenciaRowList>();
  
  onSort(column: string): void {
    this.sort.emit(column);
  }
  
  onMarkAttendance(row: AsistenciaRowList, status: 'PUNTUAL' | 'TARDANZA' | 'AUSENTE'): void {
    this.markAttendance.emit({ row, status });
  }
  
  onMarkExit(row: AsistenciaRowList): void {
    this.markExit.emit(row);
  }
  
  onAddObservation(row: AsistenciaRowList): void {
    this.addObservation.emit(row);
  }
  
  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}