import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Inscripcion } from '../../core/models';
import { InscripcionService } from '../../core/services/api.services';
import { NotificacionService } from '../../core/services/notificacion.service';
import { Estado } from '../../shared/ui';
import { mensajeError } from '../../shared/utils';
import { A11Y } from '../../shared/a11y';

/** El socio ve sus inscripciones (GET /inscripciones/mias) y puede cancelarlas. */
@Component({
  selector: 'app-mis-inscripciones',
  imports: [...A11Y, RouterLink, DatePipe, Estado],
  template: `
    <div class="cabecera">
      <div><p class="sobre">Socio</p><h1>Mis inscripciones</h1></div>
      <a routerLink="/clases" class="btn btn-primario">Ver horario e inscribirme</a>
    </div>
    <app-estado [cargando]="cargando()" [error]="error()" [vacio]="!cargando() && !lista().length"
      textoVacio="No estás inscrito en ninguna clase. Revisa el horario para inscribirte." />

    <div class="lista-tarjetas">
      @for (i of lista(); track i.id) {
        <article class="tarjeta-ins">
          <div>
            <h2>{{ i.claseNombre }}</h2>
            <p>{{ i.horario }}</p>
            <p class="texto-suave">Entrenador: {{ i.entrenadorNombre }} · inscrito el {{ i.fechaInscripcion | date: 'dd/MM/yyyy' }}</p>
          </div>
          <button type="button" class="btn btn-sm btn-peligro-txt" (click)="cancelar(i)">Cancelar</button>
        </article>
      }
    </div>
  `,
})
export class MisInscripciones implements OnInit {
  private api = inject(InscripcionService);
  private notif = inject(NotificacionService);

  protected lista = signal<Inscripcion[]>([]);
  protected cargando = signal(true);
  protected error = signal<string | null>(null);

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.api.mias().subscribe({
      next: (l) => {
        this.lista.set(l);
        this.error.set(null);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(mensajeError(e));
        this.cargando.set(false);
      },
    });
  }

  async cancelar(i: Inscripcion): Promise<void> {
    const ok = await this.notif.confirmar('Cancelar inscripción', `¿Salir de la clase ${i.claseNombre} (${i.horario})?`, 'Cancelar inscripción');
    if (!ok) return;
    this.api.eliminar(i.id).subscribe({
      next: () => {
        this.notif.exito('Inscripción cancelada');
        this.cargar();
      },
      error: (e) => this.notif.error(mensajeError(e)),
    });
  }
}
