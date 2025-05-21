import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-asistencia-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './asistencia-pagination.component.html',
  styleUrls: ['./asistencia-pagination.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AsistenciaPaginationComponent {
  @Input() currentPage = 1;
  @Input() pageSize = 10;
  @Input() totalItems = 0;
  
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();
  @Output() goToFirst = new EventEmitter<void>();
  @Output() goToLast = new EventEmitter<void>();
  @Output() goToPrevious = new EventEmitter<void>();
  @Output() goToNext = new EventEmitter<void>();
  
  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }
  
  get showingFrom(): number {
    return this.totalItems === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }
  
  get showingTo(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }
  
  onPageSizeChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    if (selectElement && selectElement.value) {
      this.pageSizeChange.emit(parseInt(selectElement.value, 10));
    }
  }
  
  onGoToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.pageChange.emit(page);
    }
  }
  
  onGoToFirst(): void {
    this.goToFirst.emit();
  }
  
  onGoToLast(): void {
    this.goToLast.emit();
  }
  
  onGoToPrevious(): void {
    this.goToPrevious.emit();
  }
  
  onGoToNext(): void {
    this.goToNext.emit();
  }
  
  getPageNumbers(): number[] {
    const totalPages = this.totalPages;
    const currentPage = this.currentPage;
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = startPage + maxVisiblePages - 1;
    
    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  }
}