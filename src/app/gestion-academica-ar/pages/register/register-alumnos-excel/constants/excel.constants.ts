import { environment } from "../../../../../../environments/environment";


export const EXCEL_CONFIG = {
  API: {
    BASE_URL: environment.apiUrl,
    ENDPOINTS: {
      ALUMNOS: '/alumnos',
      TURNOS: '/turno',
      EXCEL_IMPORT: '/alumnos/register-alumno-for-excel',
      EXCEL_EXPORT: '/alumnos/export-excel'
    }
  },
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
    MAX_PAGE_SIZE: 100
  },
  VALIDATION: {
    DNI: {
      MIN_LENGTH: 8,
      MAX_LENGTH: 8,
      PATTERN: /^\d{8}$/
    },
    CODIGO_ALUMNO: {
      PATTERN: /^ALU\d{4}$/
    }
  },
  FILE_UPLOAD: {
    EXCEL: {
      MAX_SIZE: 10 * 1024 * 1024, // 10MB
      ALLOWED_TYPES: [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ],
      ALLOWED_EXTENSIONS: ['.xlsx', '.xls']
    }
  },
  WIDGETS: {
    REFRESH_INTERVAL: 30000, // 30 segundos
    ANIMATION_DURATION: 500
  }
} as const;

export const EXCEL_MESSAGES = {
  SUCCESS: {
    IMPORT: 'Importación de Excel realizada exitosamente',
    EXPORT: 'Exportación a Excel completada',
    SAVE: 'Datos guardados correctamente',
    DELETE: 'Registro eliminado correctamente',
    CLEAR: 'Tabla limpiada correctamente'
  },
  ERROR: {
    IMPORT: 'Error durante la importación del archivo Excel',
    EXPORT: 'Error al exportar a Excel',
    FILE_FORMAT: 'Formato de archivo Excel no válido',
    FILE_SIZE: 'El archivo Excel excede el tamaño máximo permitido',
    NETWORK: 'Error de conexión con el servidor',
    VALIDATION: 'Los datos del Excel no son válidos',
    NO_DATA: 'No hay datos para procesar'
  },
  WARNING: {
    CLEAR_DATA: '¿Estás seguro de limpiar todos los datos de la tabla?',
    NO_FILE: 'Debes seleccionar un archivo Excel',
    NO_TURNO: 'Debes seleccionar un turno',
    LARGE_FILE: 'El archivo es muy grande, el procesamiento puede tardar'
  },
  INFO: {
    PROCESSING: 'Procesando archivo Excel...',
    LOADING: 'Cargando datos...',
    GENERATING_DEMO: 'Generando datos de demostración...'
  }
} as const;