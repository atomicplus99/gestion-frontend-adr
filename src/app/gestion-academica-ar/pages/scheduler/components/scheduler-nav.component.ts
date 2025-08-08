import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {SchedulerAusenciasComponent } from './main/scheduler.component';

@Component({
  selector: 'app-scheduler-main',
  standalone: true,
  imports: [
    CommonModule,
    SchedulerAusenciasComponent
],
  templateUrl: './scheduler-nav.component.html'
})
export class SchedulerMainComponent {
  // ✅ SIGNALS ACTUALIZADOS
  tabActiva = signal<'ausencias'>('ausencias');
  apiStatus = signal('Conectado');

  // ✅ MÉTODO ACTUALIZADO
  cambiarTab(tab: 'ausencias') {
    this.tabActiva.set(tab);
  }
}