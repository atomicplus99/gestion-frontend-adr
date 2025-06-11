import { Injectable } from '@angular/core';
import { NivelEducativo } from '../interfaces/AlumnoRegister.interface';


@Injectable({
  providedIn: 'root'
})
export class GradosService {
  
  obtenerGradosPorNivel(nivel: NivelEducativo): string[] {
    const gradosPorNivel: Record<NivelEducativo, string[]> = {
      'Inicial': ['1°', '2°', '3°'],
      'Primaria': ['1°', '2°', '3°', '4°', '5°', '6°'],
      'Secundaria': ['1°', '2°', '3°', '4°', '5°']
    };

    return gradosPorNivel[nivel] || [];
  }

  obtenerSecciones(): string[] {
    return Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
  }

  obtenerNivelesEducativos(): NivelEducativo[] {
    return ['Inicial', 'Primaria', 'Secundaria'];
  }
}