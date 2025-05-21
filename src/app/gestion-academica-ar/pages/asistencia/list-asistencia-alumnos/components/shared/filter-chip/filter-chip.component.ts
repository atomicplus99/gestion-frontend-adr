import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-filter-chip',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './filter-chip.component.html',
  styleUrls: ['./filter-chip.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FilterChipComponent {
  @Input() value: string = '';
  @Input() index: number = 0;
  @Output() remove = new EventEmitter<string>();

  get chipClass(): string {
    const baseClass = 'filter-chip';
    // Alternando colores según el índice
    return `${baseClass} filter-chip-${this.getColorByIndex()}`;
  }

  private getColorByIndex(): string {
    const colors = ['primary', 'success', 'warning', 'info'];
    return colors[this.index % colors.length];
  }

  onRemove(): void {
    this.remove.emit(this.value);
  }
}