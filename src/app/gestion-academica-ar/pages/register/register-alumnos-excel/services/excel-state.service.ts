import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AlumnoModuleExcel } from '../models/alumno-excel.model';
import { TurnoModuleExcel } from '../models/turno-excel.model';
import { ExcelWidgetData } from '../models/excel-import.model';


export interface ExcelState {
  alumnos: AlumnoModuleExcel[];
  turnos: TurnoModuleExcel[];
  widgets: ExcelWidgetData;
  loading: boolean;
  selectedFile: File | null;
  selectedTurnoId: string | null;
  pagination: {
    currentPage: number;
    itemsPerPage: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ExcelStateService {
  
  private readonly initialState: ExcelState = {
    alumnos: [],
    turnos: [],
    widgets: {
      importadosHoy: 0,
      registrosConError: 0,
      usuariosCreados: 0,
      porcentajeUsuariosCreados: 0,
      tiempoProceso: 0
    },
    loading: false,
    selectedFile: null,
    selectedTurnoId: null,
    pagination: {
      currentPage: 1,
      itemsPerPage: 10
    }
  };

  private state$ = new BehaviorSubject<ExcelState>(this.initialState);

  // ====================================
  // SELECTORES (GETTERS)
  // ====================================

  getState(): Observable<ExcelState> {
    return this.state$.asObservable();
  }

  getCurrentState(): ExcelState {
    return this.state$.value;
  }

  getAlumnos(): Observable<AlumnoModuleExcel[]> {
    return this.state$.pipe(map(state => state.alumnos));
  }

  getTurnos(): Observable<TurnoModuleExcel[]> {
    return this.state$.pipe(map(state => state.turnos));
  }

  getWidgets(): Observable<ExcelWidgetData> {
    return this.state$.pipe(map(state => state.widgets));
  }

  isLoading(): Observable<boolean> {
    return this.state$.pipe(map(state => state.loading));
  }

  getPagination(): Observable<{currentPage: number, itemsPerPage: number}> {
    return this.state$.pipe(map(state => state.pagination));
  }

  // ====================================
  // MUTADORES (SETTERS)
  // ====================================

  setAlumnos(alumnos: AlumnoModuleExcel[]): void {
    this.updateState({ alumnos });
  }

  setTurnos(turnos: TurnoModuleExcel[]): void {
    this.updateState({ turnos });
  }

  setWidgets(widgets: ExcelWidgetData): void {
    this.updateState({ widgets });
  }

  setLoading(loading: boolean): void {
    this.updateState({ loading });
  }

  setSelectedFile(file: File | null): void {
    this.updateState({ selectedFile: file });
  }

  setSelectedTurnoId(turnoId: string | null): void {
    this.updateState({ selectedTurnoId: turnoId });
  }

  setPagination(currentPage: number, itemsPerPage: number): void {
    this.updateState({ 
      pagination: { currentPage, itemsPerPage } 
    });
  }

  // ====================================
  // ACCIONES DE LIMPIEZA
  // ====================================

  clearAll(): void {
    this.state$.next(this.initialState);
  }

  clearResults(): void {
    this.updateState({
      alumnos: [],
      widgets: this.initialState.widgets,
      pagination: this.initialState.pagination
    });
  }

  clearForm(): void {
    this.updateState({
      selectedFile: null,
      selectedTurnoId: null
    });
  }

  // ====================================
  // MÉTODO PRIVADO PARA ACTUALIZAR ESTADO
  // ====================================

  private updateState(partial: Partial<ExcelState>): void {
    const currentState = this.state$.value;
    const newState = { ...currentState, ...partial };
    this.state$.next(newState);
  }
}