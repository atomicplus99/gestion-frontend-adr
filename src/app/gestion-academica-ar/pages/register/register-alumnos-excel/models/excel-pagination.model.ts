export interface ExcelPaginationConfig {
  paginaActual: number;
  itemsPorPagina: number;
  totalItems: number;
}

export interface ExcelPaginatedResponse<T> {
  data: T[];
  pagination: ExcelPaginationConfig;
}

export interface ExcelPaginationRequest {
  pagina?: number;
  limite?: number;
  ordenarPor?: string;
  ordenTipo?: 'ASC' | 'DESC';
  busqueda?: string;
}