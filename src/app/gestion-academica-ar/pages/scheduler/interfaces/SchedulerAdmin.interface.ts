// ✅ INTERFACES CORREGIDAS SEGÚN TU API REAL
export interface ConfiguracionTurno {
  hora: string;
  activo: boolean;
  cronExpression?: string;
  proximaEjecucion?: string | null;
}

export interface ConfiguracionGeneral {
  timezone: string;
  notificacionesActivas: boolean;
}

export interface ConfiguracionScheduler {
  id: number;
  turnoMañana: ConfiguracionTurno;
  turnoTarde: ConfiguracionTurno;
  configuracionGeneral: ConfiguracionGeneral;
  fechaActualizacion: string;
}

export interface ActualizarConfiguracion {
  turnoMañana: {
    hora: string;
    activo: boolean;
  };
  turnoTarde: {
    hora: string;
    activo: boolean;
  };
  notificacionesActivas?: boolean;
}

export interface ResultadoEjecucion {
  turno: 'mañana' | 'tarde';
  horaSimulada: string;
  cantidadRegistradas: number;
  duplicados: string[];
  justificados: string[];
  fueraDeTurno: string[];
  notificaciones: {
    enviadas: number;
    errores: number;
    sinTelegram: number;
    rateLimitErrors: number;
    tiempoTotal: number;
  };
}

// ✅ ESTA ERA LA QUE ESTABA MAL - CORREGIDA
export interface StatusScheduler {
  produccion: {
    turnoMañana: {
      horario: string;           // 🔄 API usa "horario" 
      activo: boolean;
      cronExpression: string;
      proximaEjecucion: string | null;
    };
    turnoTarde: {
      horario: string;           // 🔄 API usa "horario"
      activo: boolean;
      cronExpression: string;
      proximaEjecucion: string | null;
    };
  };
  configuracionBD: {
    id: number;
    fechaActualizacion: string;
    notificacionesActivas: boolean;
  };
}