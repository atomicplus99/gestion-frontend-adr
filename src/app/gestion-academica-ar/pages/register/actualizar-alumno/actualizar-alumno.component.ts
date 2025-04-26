import {
  Component,
  OnInit,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule }                  from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Observable }                    from 'rxjs';
import { map, startWith }                from 'rxjs/operators';
import { MatAutocompleteModule }         from '@angular/material/autocomplete';
import { MatInputModule }                from '@angular/material/input';
import { MatFormFieldModule }            from '@angular/material/form-field';
import { MatIconModule }                 from '@angular/material/icon';
import { TableStudentComponent } from '../../../../shared/components/table/table-student/table-student.component';



@Component({
  selector: 'app-actualizar-alumno',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatIconModule,
    TableStudentComponent
  ],
  templateUrl: './actualizar-alumno.component.html',
  styleUrls: ['./actualizar-alumno.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActualizarAlumnoComponent implements OnInit {

  editando = false;

  onAlumnoEditando(state: boolean) {
    this.editando = state;
  }
  /** Listado de códigos para autocompletar */
  codes: string[] = [
    '000123456', '000234567', '000345678',
    '000456789', '000567890'
  ];

  /** FormControl y stream de opciones filtradas */
  searchControl = new FormControl<string>('', { nonNullable: true });
  filteredCodes$!: Observable<string[]>;

  /** Código que seleccionó el usuario */
  selectedCode = '';

  ngOnInit() {
    this.filteredCodes$ = this.searchControl.valueChanges.pipe(
      startWith(''),
      map(value =>
        this.codes.filter(code =>
          code.toLowerCase().includes((value || '').toLowerCase())
        )
      )
    );
  }

  /**
   * Cuando se selecciona (o hace click en la lupa), actualiza el código
   * y dispara la carga de datos en el componente de tabla.
   */
  onSelectCode(code: string) {
    if (this.editando) return; // si está editando, no deja buscar
    this.selectedCode = code;
    console.log('Código seleccionado:', code);
  }
}
