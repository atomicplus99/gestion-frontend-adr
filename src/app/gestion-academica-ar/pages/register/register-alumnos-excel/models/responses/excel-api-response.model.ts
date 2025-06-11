export interface ExcelApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  total?: number;
  errores?: string[];
  timestamp: string;
}

export interface ExcelApiError {
  success: false;
  message: string;
  errores: string[];
  timestamp: string;
  statusCode: number;
}