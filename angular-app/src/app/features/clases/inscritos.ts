import { DatePipe } from '@angular/common';
import { Component, inject, input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Clase, Inscripcion } from '../../core/models';
import { ClaseService, InscripcionService } from '../../core/services/api.services';
import { AuthService } from '../../core/services/auth.service';
import { NotificacionService } from '../../core/services/notificacion.service';
import { Estado, EtiquetaPipe, HoraPipe } from '../../shared/ui';
import { mensajeError } from '../../shared/utils';
import { A11Y } from '../../shared/a11y';

/** GET /clases/{id}/inscritos (ADMIN, RECEPCIONISTA y el entrenador dueño de la clase). */
@Component({
  selector: 'app-inscritos',
  imports: [...A11Y, RouterLink, DatePipe, EtiquetaPipe, HoraPipe, Estado],
  template: `
    <a [routerLink]="esEntrenador ? '/mis-clases' : '/clases'" class="volver">← Clases</a>
    @if (clase(); as c) {
      <div class="cabecera">
        <div>
          <p class="sobre">{{ c.diaSemana | etiqueta }} · {{ c.horaInicio | hora }}–{{ c.horaFin | hora }} · {{ c.entrenadorNombre }}</p>
          <h1>{{ c.nombre }}</h1>
        </div>
        <div class="contador"><strong>{{ lista().length }}</strong> / {{ c.cupoMaximo }} inscritos</div>
      </div>
    }
    <app-estado [cargando]="cargando()" [error]="error()" [vacio]="!cargando() && !lista().length" textoVacio="Nadie se ha inscrito todavía." />

    @if (lista().length) {
      <div class="tabla-cont"><table class="tabla">
        <thead><tr><th>#</th><th>Socio</th><th>Cédula</th><th>Inscrito el</th>@if (puedeCancelar) { <th></th> }</tr></thead>
        <tbody>
          @for (i of lista(); track i.id; let n = $index) {
            <tr>
              <td class="num">{{ n + 1 }}</td>
              <td>{{ i.socioNombre }}</td>
              <td>{{ i.socioCedula }}</td>
              <td>{{ i.fechaInscripcion | date: 'dd/MM/yyyy HH:mm' }}</td>
              @if (puedeCancelar) {
                <td class="acciones-fila"><button type="button" class="btn btn-sm btn-peligro-txt" (click)="cancelar(i)">Quitar</button></td>
              }
            </tr>
          }
        </tbody>
      </table></div>
    }
  `,
})
export class Inscritos implements OnInit {
  id = input.required<string>();

  private clases = inject(ClaseService);
  private inscripciones = inject(InscripcionService);
  private notif = inject(NotificacionService);
  private auth = inject(AuthService);
  protected esEntrenador = this.auth.tieneRol('ENTRENADOR');
  protected puedeCancelar = this.auth.tieneRol('ADMIN', 'RECEPCIONISTA');

  protected clase = signal<Clase | null>(null);
  protected lista = signal<Inscripcion[]>([]);
  protected cargando = signal(true);
  protected error = signal<string | null>(null);

  ngOnInit(): void {
    this.clases.buscar(Number(this.id())).subscribe((c) => this.clase.set(c));
    this.cargar();
  }

  cargar(): void {
    this.clases.inscritos(Number(this.id())).subscribe({
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
    const ok = await this.notif.confirmar('Quitar de la clase', `¿Quitar a ${i.socioNombre} de esta clase?`, 'Quitar');
    if (!ok) return;
    this.inscripciones.eliminar(i.id).subscribe({
      next: () => {
        this.notif.exito('Inscripción cancelada');
        this.cargar();
      },
      error: (e) => this.notif.error(mensajeError(e)),
    });
  }
}
