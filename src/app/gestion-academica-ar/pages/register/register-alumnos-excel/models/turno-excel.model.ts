export interface TurnoModuleExcel {
  id_turno: string;
  turno: string;
  hora_inicio: string;
  hora_fin: string;
  hora_limite: string;
}

export type TurnoExcelCreateDto = Omit<TurnoModuleExcel, 'id_turno'>;

export type TurnoExcelUpdateDto = Partial<TurnoExcelCreateDto>;