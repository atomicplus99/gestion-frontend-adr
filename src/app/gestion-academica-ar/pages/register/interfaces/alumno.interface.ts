import { Turno } from "./turno.interface";
import { Usuario } from "./user.interface";

export interface Alumno {
    id_alumno: string;
    codigo: string;
    dni_alumno: string;
    nombre: string;
    apellido: string;
    fecha_nacimiento: string;
    direccion: string;
    codigo_qr: string;
    nivel: string;
    grado: number;
    seccion: string;
    turno?: Turno;
    usuario?: Usuario;
  }

export interface PersonalAlumno {
    id_alumno: string;
    codigo: string;
    dni_alumno: string;
    nombre: string;
    apellido: string;
    fecha_nacimiento: string;  
    direccion: string;
    nivel: string;
    grado: number;
    seccion: string;
  }
  