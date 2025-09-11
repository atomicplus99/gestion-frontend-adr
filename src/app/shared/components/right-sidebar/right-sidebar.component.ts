import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Note {
  id: string;
  content: string;
  createdAt: Date;
}

@Component({
  selector: 'app-right-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './right-sidebar.component.html',
  styleUrl: './right-sidebar.component.css'
})
export class RightSidebarComponent implements OnInit, OnDestroy {
  // Signals para las notas
  notes = signal<Note[]>([]);
  newNoteContent = signal<string>('');
  isOpen = signal<boolean>(false);
  
  // Contador para generar IDs únicos
  private noteCounter = 0;

  ngOnInit() {
    // Cargar notas desde sessionStorage al inicializar
    this.loadNotesFromStorage();
  }

  ngOnDestroy() {
    // Guardar notas en sessionStorage al destruir el componente
    this.saveNotesToStorage();
  }

  // Cargar notas desde sessionStorage
  private loadNotesFromStorage(): void {
    try {
      const savedNotes = sessionStorage.getItem('user_notes');
      if (savedNotes) {
        const notes = JSON.parse(savedNotes);
        // Convertir las fechas de string a Date
        const notesWithDates = notes.map((note: any) => ({
          ...note,
          createdAt: new Date(note.createdAt)
        }));
        this.notes.set(notesWithDates);
        // Actualizar el contador para evitar IDs duplicados
        this.noteCounter = Math.max(...notesWithDates.map((note: any) => {
          const match = note.id.match(/note_(\d+)_/);
          return match ? parseInt(match[1]) : 0;
        }), 0);
      }
    } catch (error) {
      console.error('Error al cargar notas:', error);
    }
  }

  // Guardar notas en sessionStorage
  private saveNotesToStorage(): void {
    try {
      sessionStorage.setItem('user_notes', JSON.stringify(this.notes()));
    } catch (error) {
      console.error('Error al guardar notas:', error);
    }
  }

  // Toggle del sidebar
  toggleSidebar(): void {
    this.isOpen.update(current => !current);
  }

  // Cerrar sidebar
  closeSidebar(): void {
    this.isOpen.set(false);
  }

  // Agregar nueva nota
  addNote(): void {
    const content = this.newNoteContent().trim();
    if (content) {
      const newNote: Note = {
        id: `note_${++this.noteCounter}_${Date.now()}`,
        content: content,
        createdAt: new Date()
      };
      
      this.notes.update(currentNotes => [newNote, ...currentNotes]);
      this.newNoteContent.set('');
      // Guardar inmediatamente después de agregar
      this.saveNotesToStorage();
    }
  }

  // Eliminar nota
  deleteNote(noteId: string): void {
    this.notes.update(currentNotes => 
      currentNotes.filter(note => note.id !== noteId)
    );
    // Guardar inmediatamente después de eliminar
    this.saveNotesToStorage();
  }

  // Formatear fecha de creación
  formatDate(date: Date): string {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  // Manejar Enter en el textarea
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.addNote();
    }
  }
}
