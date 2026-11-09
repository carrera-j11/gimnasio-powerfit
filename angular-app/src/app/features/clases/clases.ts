import { booleanAttribute, Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { Clase, DIAS, DiaSemana, Inscripcion } from '../../core/models';
import { ClaseService, InscripcionService } from '../../core/services/api.services';
import { AuthService } from '../../core/services/auth.service';
import { NotificacionService } from '../../core/services/notificacion.service';
import { Estado, EtiquetaPipe, HoraPipe } from '../../shared/ui';
import { mensajeError } from '../../shared/utils';
import { InscripcionForm } from '../inscripciones/inscripcion-form';
import { ClaseForm } from './clase-form';
import { A11Y } from '../../shared/a11y';

const HOY = (['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'] as DiaSemana[])[new Date().getDay()];

/**
 * Horario semanal de clases. Las acciones cambian según el rol:
 * - SOCIO: inscribirse / cancelar su inscripción.
 * - ENTRENADOR: crear, editar y eliminar sus clases; ver inscritos.
 * - ADMIN: todo lo anterior sobre cualquier clase.
 * - RECEPCIONISTA: inscribir socios y ver inscritos.
 * Con data.mias (ruta /mis-clases) muestra solo las clases del entrenador.
 */
@Component({
  selector: 'app-clases',
  imports: [...A11Y, RouterLink, EtiquetaPipe, HoraPipe, Estado, ClaseForm, InscripcionForm],
  template: `
    <div class="cabecera">
      <div><p class="sobre">{{ mias() ? 'Entrenador' : 'Horario semanal' }}</p><h1>{{ mias() ? 'Mis clases' : 'Clases' }}</h1></div>
      @if (puedeCrear) {
        <button type="button" class="btn btn-primario" (click)="abrirNueva(null)">Nueva clase</button>
      }
    </div>

    <app-estado [cargando]="cargando()" [error]="error()" [vacio]="!cargando() && !clases().length"
      [textoVacio]="mias() ? 'Aún no tiene clases. Cree la primera con Nueva clase.' : 'Aún no hay clases programadas.'" />

    @if (clases().length) {
      <div class="semana">
        @for (d of dias; track d) {
          <section class="dia" [class.dia-hoy]="d === hoy">
            <h2 class="dia-titulo">{{ d | etiqueta }} @if (d === hoy) { <span class="hoy">hoy</span> }</h2>
            @for (c of porDia()[d]; track c.id) {
              <article class="clase" [class.clase-mia]="inscritaEn(c.id)">
                <p class="clase-hora">{{ c.horaInicio | hora }}–{{ c.horaFin | hora }}</p>
                <h3 class="clase-nombre">{{ c.nombre }}</h3>
                <p class="clase-ent">{{ c.entrenadorNombre }}</p>
                @if (c.descripcion) { <p class="clase-desc">{{ c.descripcion }}</p> }
                <div class="cupo" [title]="c.inscritos + ' de ' + c.cupoMaximo + ' cupos ocupados'">
                  <div class="cupo-barra"><span [style.width.%]="(c.inscritos / c.cupoMaximo) * 100" [class.lleno]="c.cuposDisponibles <= 0"></span></div>
                  <small>{{ c.cuposDisponibles > 0 ? c.cuposDisponibles + ' cupos libres' : 'Clase llena' }}</small>
                </div>
                <div class="clase-acciones">
                  @if (esSocio) {
                    @if (inscritaEn(c.id); as i) {
                      <button type="button" class="btn btn-sm btn-peligro-txt" (click)="cancelarInscripcion(i)">Cancelar inscripción</button>
                    } @else {
                      <button type="button" class="btn btn-sm btn-primario" [disabled]="c.cuposDisponibles <= 0 || procesando()" (click)="inscribirme(c)">Inscribirme</button>
                    }
                  }
                  @if (puedeVerInscritos(c)) {
                    <a [routerLink]="['/clases', c.id, 'inscritos']" class="btn btn-sm">Inscritos ({{ c.inscritos }})</a>
                  }
                  @if (esRecepcion && c.cuposDisponibles > 0) {
                    <button type="button" class="btn btn-sm" (click)="inscribirEn.set(c.id)">Inscribir socio</button>
                  }
                  @if (puedeEditar(c)) {
                    <button type="button" class="btn btn-sm" (click)="editando.set(c)">Editar</button>
                    <button type="button" class="btn btn-sm btn-peligro-txt" (click)="eliminar(c)">Eliminar</button>
                  }
                </div>
              </article>
            } @empty {
              <p class="dia-vacio">Sin clases</p>
            }
            @if (puedeCrear) {
              <button type="button" class="dia-agregar" (click)="abrirNueva(d)">+ Agregar</button>
            }
          </section>
        }
      </div>
    }

    @if (creandoDia() !== undefined) {
      <app-clase-form [diaInicial]="creandoDia() ?? null" (cerrar)="creandoDia.set(undefined)" (guardado)="creandoDia.set(undefined); cargar()" />
    }
    @if (editando(); as c) {
      <app-clase-form [clase]="c" (cerrar)="editando.set(null)" (guardado)="editando.set(null); cargar()" />
    }
    @if (inscribirEn(); as id) {
      <app-inscripcion-form [claseId]="id" (cerrar)="inscribirEn.set(null)" (guardado)="inscribirEn.set(null); cargar()" />
    }
  `,
})
export class Clases implements OnInit {
  /** true en la ruta /mis-clases (data de la ruta enlazada como input) */
  mias = input(false, { transform: booleanAttribute });

  private api = inject(ClaseService);
  private inscripcionesApi = inject(InscripcionService);
  private notif = inject(NotificacionService);
  private auth = inject(AuthService);

  protected dias = DIAS;
  protected hoy = HOY;
  protected esSocio = this.auth.tieneRol('SOCIO');
  protected esRecepcion = this.auth.tieneRol('ADMIN', 'RECEPCIONISTA');
  protected puedeCrear = this.auth.tieneRol('ADMIN', 'ENTRENADOR');

  protected clases = signal<Clase[]>([]);
  protected misInscripciones = signal<Inscripcion[]>([]);
  protected cargando = signal(true);
  protected procesando = signal(false);
  protected error = signal<string | null>(null);
  protected creandoDia = signal<DiaSemana | null | undefined>(undefined);
  protected editando = signal<Clase | null>(null);
  protected inscribirEn = signal<number | null>(null);

  protected porDia = computed(() => {
    const mapa = Object.fromEntries(DIAS.map((d) => [d, [] as Clase[]])) as Record<DiaSemana, Clase[]>;
    for (const c of this.clases()) mapa[c.diaSemana].push(c);
    for (const d of DIAS) mapa[d].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
    return mapa;
  });

  /** id del perfil de entrenador del usuario (para saber cuáles clases son suyas) */
  private miEntrenadorId = this.auth.usuario()?.perfilId ?? null;

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    const esEntrenador = this.auth.tieneRol('ENTRENADOR');
    forkJoin({
      clases: this.mias() && esEntrenador ? this.api.mias() : this.api.listar(),
      inscripciones: this.esSocio ? this.inscripcionesApi.mias() : of([] as Inscripcion[]),
    }).subscribe({
      next: (r) => {
        this.clases.set(r.clases);
        this.misInscripciones.set(r.inscripciones);
        this.error.set(null);
        this.cargando.set(false);
        this.procesando.set(false);
      },
      error: (e) => {
        this.error.set(mensajeError(e));
        this.cargando.set(false);
        this.procesando.set(false);
      },
    });
  }

  protected inscritaEn(claseId: number): Inscripcion | null {
    return this.misInscripciones().find((i) => i.claseId === claseId) ?? null;
  }

  protected puedeEditar(c: Clase): boolean {
    return this.auth.tieneRol('ADMIN') || (this.auth.tieneRol('ENTRENADOR') && c.entrenadorId === this.miEntrenadorId);
  }

  protected puedeVerInscritos(c: Clase): boolean {
    return this.auth.tieneRol('ADMIN', 'RECEPCIONISTA') || (this.auth.tieneRol('ENTRENADOR') && c.entrenadorId === this.miEntrenadorId);
  }

  abrirNueva(dia: DiaSemana | null): void {
    this.creandoDia.set(dia);
  }

  inscribirme(c: Clase): void {
    this.procesando.set(true);
    this.inscripcionesApi.crear({ claseId: c.id }).subscribe({
      next: () => {
        this.notif.exito(`Te inscribiste en ${c.nombre}`);
        this.cargar();
      },
      error: (e) => {
        // Ej.: sin membresía vigente, clase llena o choque de horario
        this.notif.error(mensajeError(e));
        this.procesando.set(false);
      },
    });
  }

  async cancelarInscripcion(i: Inscripcion): Promise<void> {
    const ok = await this.notif.confirmar('Cancelar inscripción', `¿Salir de la clase ${i.claseNombre} (${i.horario})?`, 'Cancelar inscripción');
    if (!ok) return;
    this.inscripcionesApi.eliminar(i.id).subscribe({
      next: () => {
        this.notif.exito('Inscripción cancelada');
        this.cargar();
      },
      error: (e) => this.notif.error(mensajeError(e)),
    });
  }

  async eliminar(c: Clase): Promise<void> {
    const ok = await this.notif.confirmar('Eliminar clase', `¿Eliminar la clase ${c.nombre} del ${c.diaSemana.toLowerCase()}? Solo es posible si no tiene inscritos.`);
    if (!ok) return;
    this.api.eliminar(c.id).subscribe({
      next: () => {
        this.notif.exito('Clase eliminada');
        this.cargar();
      },
      error: (e) => this.notif.error(mensajeError(e)),
    });
  }
}
