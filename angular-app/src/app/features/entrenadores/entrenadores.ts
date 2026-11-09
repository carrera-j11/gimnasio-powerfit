import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Entrenador } from '../../core/models';
import { EntrenadorService } from '../../core/services/api.services';
import { AuthService } from '../../core/services/auth.service';
import { NotificacionService } from '../../core/services/notificacion.service';
import { Estado, Modal } from '../../shared/ui';
import { aplicarErroresApi, celular, errorDe, mensajeError, soloLetras } from '../../shared/utils';
import { A11Y } from '../../shared/a11y';

/** Todos ven los entrenadores; el ADMIN edita y elimina. */
@Component({
  selector: 'app-entrenadores',
  imports: [...A11Y, ReactiveFormsModule, Estado, Modal],
  template: `
    <div class="cabecera"><div><p class="sobre">Equipo</p><h1>Entrenadores</h1></div></div>
    <app-estado [cargando]="cargando()" [error]="error()" [vacio]="!cargando() && !lista().length" textoVacio="Aún no hay entrenadores aprobados." />

    <div class="tarjetas-entrenador">
      @for (e of lista(); track e.id) {
        <article class="entrenador">
          <div class="avatar" aria-hidden="true">{{ e.nombres[0] }}{{ e.apellidos[0] }}</div>
          <div class="entrenador-info">
            <h2>{{ e.nombres }} {{ e.apellidos }}</h2>
            <p class="especialidad">{{ e.especialidad }}</p>
            <p class="texto-suave">{{ e.email }} · {{ e.celular }}</p>
            <p class="texto-suave">Desde {{ e.fechaIngreso }} · {{ e.totalClases }} {{ e.totalClases === 1 ? 'clase' : 'clases' }}</p>
          </div>
          @if (esAdmin) {
            <div class="acciones-izq">
              <button type="button" class="btn btn-sm" (click)="editar(e)">Editar</button>
              <button type="button" class="btn btn-sm btn-peligro-txt" (click)="eliminar(e)">Eliminar</button>
            </div>
          }
        </article>
      }
    </div>

    @if (seleccionado(); as e) {
      <app-modal [titulo]="'Editar entrenador'" (cerrar)="seleccionado.set(null)">
        <form [formGroup]="form" (ngSubmit)="guardar()" novalidate>
          <div class="rejilla-2">
            <label class="campo"><span>Nombres</span><input id="ent-nombres" formControlName="nombres" />
              @if (err('nombres'); as m) { <small class="err">{{ m }}</small> }</label>
            <label class="campo"><span>Apellidos</span><input id="ent-apellidos" formControlName="apellidos" />
              @if (err('apellidos'); as m) { <small class="err">{{ m }}</small> }</label>
            <label class="campo"><span>Celular</span><input id="ent-celular" formControlName="celular" maxlength="10" />
              @if (err('celular'); as m) { <small class="err">{{ m }}</small> }</label>
            <label class="campo"><span>Especialidad</span><input id="ent-especialidad" formControlName="especialidad" />
              @if (err('especialidad'); as m) { <small class="err">{{ m }}</small> }</label>
          </div>
          <div class="acciones">
            <button type="button" class="btn" (click)="seleccionado.set(null)">Volver</button>
            <button type="submit" class="btn btn-primario" [disabled]="guardando()">{{ guardando() ? 'Guardando…' : 'Guardar' }}</button>
          </div>
        </form>
      </app-modal>
    }
  `,
})
export class Entrenadores implements OnInit {
  private api = inject(EntrenadorService);
  private notif = inject(NotificacionService);
  protected esAdmin = inject(AuthService).tieneRol('ADMIN');

  protected lista = signal<Entrenador[]>([]);
  protected cargando = signal(true);
  protected error = signal<string | null>(null);
  protected seleccionado = signal<Entrenador | null>(null);
  protected guardando = signal(false);

  protected form = inject(FormBuilder).nonNullable.group({
    nombres: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50), soloLetras]],
    apellidos: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50), soloLetras]],
    celular: ['', [Validators.required, celular]],
    especialidad: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(60)]],
  });

  protected err(c: string) {
    return errorDe(this.form.get(c));
  }

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.api.listar().subscribe({
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

  editar(e: Entrenador): void {
    this.form.setValue({ nombres: e.nombres, apellidos: e.apellidos, celular: e.celular, especialidad: e.especialidad });
    this.seleccionado.set(e);
  }

  guardar(): void {
    const e = this.seleccionado();
    if (!e) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    this.api.actualizar(e.id, this.form.getRawValue()).subscribe({
      next: () => {
        this.notif.exito('Entrenador actualizado');
        this.guardando.set(false);
        this.seleccionado.set(null);
        this.cargar();
      },
      error: (err) => {
        aplicarErroresApi(this.form, err);
        this.notif.error(mensajeError(err));
        this.guardando.set(false);
      },
    });
  }

  async eliminar(e: Entrenador): Promise<void> {
    const ok = await this.notif.confirmar('Eliminar entrenador', `¿Eliminar a ${e.nombres} ${e.apellidos}? Solo es posible si no tiene clases.`);
    if (!ok) return;
    this.api.eliminar(e.id).subscribe({
      next: () => {
        this.notif.exito('Entrenador eliminado');
        this.cargar();
      },
      error: (err) => this.notif.error(mensajeError(err)),
    });
  }
}
