import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Inscripcion } from '../../core/models';
import { InscripcionService } from '../../core/services/api.services';
import { NotificacionService } from '../../core/services/notificacion.service';
import { Estado } from '../../shared/ui';
import { mensajeError, normalizar } from '../../shared/utils';
import { InscripcionForm } from './inscripcion-form';
import { A11Y } from '../../shared/a11y';

/** Todas las inscripciones (ADMIN y RECEPCIONISTA). No se editan: se cancelan y se crea otra. */
@Component({
  selector: 'app-inscripciones',
  imports: [...A11Y, FormsModule, RouterLink, DatePipe, Estado, InscripcionForm],
  template: `
    <div class="cabecera">
      <div><p class="sobre">Recepción</p><h1>Inscripciones</h1></div>
      <button type="button" class="btn btn-primario" (click)="creando.set(true)">Inscribir socio</button>
    </div>

    <div class="filtros">
      <label class="campo campo-linea campo-crece"><span>Buscar</span>
        <input id="ins-buscar" [(ngModel)]="texto" placeholder="Socio, cédula, clase o entrenador" />
      </label>
    </div>

    <app-estado [cargando]="cargando()" [error]="error()" [vacio]="!cargando() && !filtradas().length" />

    @if (filtradas().length) {
      <div class="tabla-cont"><table class="tabla">
        <thead><tr><th>#</th><th>Socio</th><th>Clase</th><th>Horario</th><th>Entrenador</th><th>Inscrito el</th><th></th></tr></thead>
        <tbody>
          @for (i of filtradas(); track i.id) {
            <tr>
              <td class="num">{{ i.id }}</td>
              <td><a [routerLink]="['/socios', i.socioId]" class="enlace-fuerte">{{ i.socioNombre }}</a><br /><small class="texto-suave">{{ i.socioCedula }}</small></td>
              <td><a [routerLink]="['/clases', i.claseId, 'inscritos']">{{ i.claseNombre }}</a></td>
              <td>{{ i.horario }}</td>
              <td>{{ i.entrenadorNombre }}</td>
              <td>{{ i.fechaInscripcion | date: 'dd/MM/yyyy HH:mm' }}</td>
              <td class="acciones-fila"><button type="button" class="btn btn-sm btn-peligro-txt" (click)="cancelar(i)">Cancelar</button></td>
            </tr>
          }
        </tbody>
      </table></div>
    }

    @if (creando()) {
      <app-inscripcion-form (cerrar)="creando.set(false)" (guardado)="creando.set(false); cargar()" />
    }
  `,
})
export class Inscripciones implements OnInit {
  private api = inject(InscripcionService);
  private notif = inject(NotificacionService);

  protected lista = signal<Inscripcion[]>([]);
  protected cargando = signal(true);
  protected error = signal<string | null>(null);
  protected creando = signal(false);

  private textoS = signal('');
  get texto() { return this.textoS(); }
  set texto(v: string) { this.textoS.set(v); }

  protected filtradas = computed(() => {
    const t = normalizar(this.textoS());
    return this.lista().filter(
      (i) => !t || normalizar(`${i.socioNombre} ${i.socioCedula} ${i.claseNombre} ${i.entrenadorNombre}`).includes(t),
    );
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.api.listar().subscribe({
      next: (l) => {
        this.lista.set(l.sort((a, b) => b.id - a.id));
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
    const ok = await this.notif.confirmar('Cancelar inscripción', `¿Quitar a ${i.socioNombre} de ${i.claseNombre} (${i.horario})?`, 'Cancelar inscripción');
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
