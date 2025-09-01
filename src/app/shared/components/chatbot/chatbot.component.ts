import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatbotQuestion {
  id: string;
  question: string;
  answer: string;
  module: string;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css']
})
export class ChatbotComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Estado del chatbot
  isOpen = signal<boolean>(false);
  messages = signal<ChatMessage[]>([]);
  currentMessage = signal<string>('');
  isLoading = signal<boolean>(false);

  // Preguntas frecuentes por módulo
  questions: ChatbotQuestion[] = [
    // Administración de Personal
    {
      id: 'admin-personal-1',
      question: '¿Qué es Administración de Personal?',
      answer: 'Es el módulo donde puedes gestionar el personal del colegio: Directores, Auxiliares, Administradores y Alumnos. Aquí puedes crear, editar, eliminar y asignar usuarios a cada miembro del personal.',
      module: 'Administración de Personal'
    },
    {
      id: 'admin-personal-2',
      question: '¿Cómo asigno un usuario a un director?',
      answer: 'Ve a Administración de Personal > Directores, selecciona un director y haz clic en "Cambiar Usuario". Podrás asignar un usuario existente o crear uno nuevo.',
      module: 'Administración de Personal'
    },
    {
      id: 'admin-personal-3',
      question: '¿Puedo eliminar un director?',
      answer: 'Sí, pero primero debes verificar que no tenga usuarios asignados. El sistema te mostrará una advertencia si el director tiene usuarios vinculados.',
      module: 'Administración de Personal'
    },

    // Asistencia
    {
      id: 'asistencia-1',
      question: '¿Qué es el módulo de Asistencia?',
      answer: 'Permite registrar y gestionar la asistencia de los alumnos. Puedes marcar entradas, salidas, ausencias y generar reportes de asistencia por período.',
      module: 'Asistencia'
    },
    {
      id: 'asistencia-2',
      question: '¿Cómo registro la asistencia de un alumno?',
      answer: 'Ve a Asistencia > Registrar Asistencia, selecciona el alumno y marca si está presente, ausente o justificado. También puedes registrar la hora de entrada/salida.',
      module: 'Asistencia'
    },
    {
      id: 'asistencia-3',
      question: '¿Qué son las ausencias masivas?',
      answer: 'Son ausencias programadas para múltiples alumnos, como feriados, eventos escolares o suspensiones. Se pueden programar con anticipación.',
      module: 'Asistencia'
    },

    // Registro de Alumnos
    {
      id: 'registro-1',
      question: '¿Cómo registro un nuevo alumno?',
      answer: 'Ve a Registro de Alumnos y selecciona "Registro Manual" o "Registro por Excel". Completa los datos personales, académicos y del apoderado.',
      module: 'Registro de Alumnos'
    },
    {
      id: 'registro-2',
      question: '¿Puedo registrar múltiples alumnos con Excel?',
      answer: 'Sí, descarga la plantilla Excel, completa los datos de los alumnos y súbela. El sistema validará y procesará todos los registros automáticamente.',
      module: 'Registro de Alumnos'
    },
    {
      id: 'registro-3',
      question: '¿Qué datos necesito para registrar un alumno?',
      answer: 'Datos personales (DNI, nombres, apellidos, fecha de nacimiento), datos académicos (grado, sección, turno) y datos del apoderado (nombres, teléfono, email).',
      module: 'Registro de Alumnos'
    },

    // Justificaciones
    {
      id: 'justificaciones-1',
      question: '¿Qué son las justificaciones?',
      answer: 'Son solicitudes de los apoderados para justificar las ausencias de sus hijos. Puedes aprobar, rechazar o solicitar más información.',
      module: 'Justificaciones'
    },
    {
      id: 'justificaciones-2',
      question: '¿Cómo apruebo una justificación?',
      answer: 'Ve a Justificaciones, revisa la solicitud y los documentos adjuntos, luego selecciona "Aprobar" o "Rechazar" con un comentario explicativo.',
      module: 'Justificaciones'
    },

    // Usuarios
    {
      id: 'usuarios-1',
      question: '¿Qué es Lista de Usuarios?',
      answer: 'Es donde puedes ver, editar y gestionar todos los usuarios del sistema. Puedes filtrar por rol, estado activo y buscar por nombre.',
      module: 'Usuarios'
    },
    {
      id: 'usuarios-2',
      question: '¿Cómo cambio la contraseña de un usuario?',
      answer: 'En Lista de Usuarios, selecciona el usuario y haz clic en "Editar". También puedes ir a "Mi Perfil" para cambiar tu propia contraseña.',
      module: 'Usuarios'
    },

    // General
    {
      id: 'general-1',
      question: '¿Cómo cambio mi contraseña?',
      answer: 'Ve a "Mi Perfil" (icono de perfil en el sidebar) y en la sección "Seguridad" puedes cambiar tu contraseña actual.',
      module: 'General'
    },
    {
      id: 'general-2',
      question: '¿Qué hago si olvido mi contraseña?',
      answer: 'En la pantalla de login, haz clic en "¿Olvidaste tu Contraseña?" e ingresa tu email. Recibirás un enlace para restablecerla.',
      module: 'General'
    },
    {
      id: 'general-3',
      question: '¿Cómo navego por el sistema?',
      answer: 'Usa el menú lateral izquierdo para acceder a cada módulo. El sistema está organizado por funcionalidades: Personal, Asistencia, Registro, etc.',
      module: 'General'
    }
  ];

  ngOnInit(): void {
    this.initializeChatbot();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeChatbot(): void {
    // Mensaje de bienvenida
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      text: '¡Hola! Soy tu asistente virtual. Puedo ayudarte a entender cómo usar el sistema de gestión académica. ¿En qué módulo necesitas ayuda?',
      isUser: false,
      timestamp: new Date()
    };
    
    this.messages.set([welcomeMessage]);
  }

  toggleChatbot(): void {
    this.isOpen.set(!this.isOpen());
  }

  sendMessage(): void {
    const messageText = this.currentMessage().trim();
    if (!messageText || this.isLoading()) return;

    // Agregar mensaje del usuario
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: messageText,
      isUser: true,
      timestamp: new Date()
    };

    this.messages.set([...this.messages(), userMessage]);
    this.currentMessage.set('');
    this.isLoading.set(true);

    // Procesar respuesta inmediatamente
    try {
      const response = this.processMessage(messageText);
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date()
      };

      // Simular un pequeño delay para mejor UX
      setTimeout(() => {
        this.messages.set([...this.messages(), botMessage]);
        this.isLoading.set(false);
      }, 500);
    } catch (error) {
      console.error('Error procesando mensaje:', error);
      this.isLoading.set(false);
    }
  }

  private processMessage(message: string): string {
    const lowerMessage = message.toLowerCase();
    let response = '';

    // Buscar coincidencias en las preguntas
    const matchedQuestion = this.questions.find(q => 
      lowerMessage.includes(q.question.toLowerCase().split(' ')[0]) ||
      lowerMessage.includes(q.module.toLowerCase()) ||
      this.findKeywordMatch(lowerMessage, q)
    );

    if (matchedQuestion) {
      response = matchedQuestion.answer;
    } else if (lowerMessage.includes('hola') || lowerMessage.includes('ayuda')) {
      response = '¡Hola! Puedo ayudarte con información sobre:\n\n• Administración de Personal\n• Asistencia\n• Registro de Alumnos\n• Justificaciones\n• Usuarios\n• Configuración general\n\n¿Sobre qué módulo te gustaría saber más?';
    } else if (lowerMessage.includes('módulo') || lowerMessage.includes('modulo')) {
      response = 'Los módulos principales del sistema son:\n\n• Administración de Personal: Gestiona directores, auxiliares y administradores\n• Asistencia: Registra y controla la asistencia de alumnos\n• Registro de Alumnos: Inscribe nuevos estudiantes\n• Justificaciones: Gestiona solicitudes de justificación de ausencias\n• Usuarios: Administra cuentas de usuario del sistema\n\n¿Cuál te interesa más?';
    } else {
      response = 'No estoy seguro de cómo ayudarte con eso. Puedes preguntarme sobre:\n\n• Cómo usar cada módulo del sistema\n• Procesos específicos (registrar alumnos, gestionar asistencia, etc.)\n• Configuración de usuarios\n• Cambio de contraseñas\n\n¿Podrías ser más específico?';
    }

    return response;
  }

  private findKeywordMatch(message: string, question: ChatbotQuestion): boolean {
    const keywords: { [key: string]: string[] } = {
      'administración': ['admin', 'personal', 'director', 'auxiliar'],
      'asistencia': ['asistencia', 'presente', 'ausente', 'falta'],
      'registro': ['registro', 'alumno', 'inscribir', 'nuevo'],
      'justificaciones': ['justificación', 'justificar', 'apoderado'],
      'usuarios': ['usuario', 'cuenta', 'perfil', 'contraseña']
    };

    const moduleKey = question.module.toLowerCase();
    if (keywords[moduleKey]) {
      return keywords[moduleKey].some((keyword: string) => message.includes(keyword));
    }
    return false;
  }

  selectQuickQuestion(question: string): void {
    this.currentMessage.set(question);
    this.sendMessage();
  }

  // Método para forzar el desbloqueo en caso de error
  forceUnlock(): void {
    this.isLoading.set(false);
  }

  clearChat(): void {
    this.initializeChatbot();
  }

  formatMessage(text: string): string {
    return text.replace(/\n/g, '<br>');
  }
}
