import { CurrencyPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Plan } from '../../core/models';
import { PlanService } from '../../core/services/api.services';
import { NotificacionService } from '../../core/services/notificacion.service';
import { Estado, Modal } from '../../shared/ui';
import { aplicarErroresApi, errorDe, mensajeError } from '../../shared/utils';
import { A11Y } from '../../shared/a11y';

/** Solo existen 3 planes: el ADMIN cambia el precio y la descripción (no se crean ni eliminan). */
@Component({
  selector: 'app-planes',
  imports: [...A11Y, ReactiveFormsModule, CurrencyPipe, Estado, Modal],
  template: `
    <div class="cabecera"><div><p class="sobre">Administración</p><h1>Planes de membresía</h1></div></div>
    <p class="texto-suave">El gimnasio maneja tres planes con duración fija. Puede cambiar su precio (entre $1.00 y $1000.00) y su descripción.</p>
    <app-estado [cargando]="cargando()" [error]="error()" />

    <div class="planes">
      @for (p of planes(); track p.id) {
        <article class="plan">
          <p class="plan-tipo">{{ p.nombre }}</p>
          <p class="plan-precio">{{ p.precio | currency: 'USD' }}</p>
          <p class="plan-dias">{{ p.duracionDias }} días</p>
          <p class="plan-desc">{{ p.descripcion || 'Sin descripción' }}</p>
          <button type="button" class="btn" (click)="editar(p)">Editar precio</button>
        </article>
      }
    </div>

    @if (seleccionado(); as p) {
      <app-modal [titulo]="'Editar ' + p.nombre" (cerrar)="seleccionado.set(null)">
        <form [formGroup]="form" (ngSubmit)="guardar()" novalidate>
          <label class="campo"><span>Precio (USD)</span>
            <input id="plan-precio" type="number" step="0.01" min="1" max="1000" formControlName="precio" />
            @if (err('precio'); as e) { <small class="err">{{ e }}</small> }</label>
          <label class="campo"><span>Descripción</span>
            <textarea id="plan-descripcion" formControlName="descripcion" rows="3" maxlength="255"></textarea>
            @if (err('descripcion'); as e) { <small class="err">{{ e }}</small> }</label>
          <div class="acciones">
            <button type="button" class="btn" (click)="seleccionado.set(null)">Volver</button>
            <button type="submit" class="btn btn-primario" [disabled]="guardando()">{{ guardando() ? 'Guardando…' : 'Guardar' }}</button>
          </div>
        </form>
      </app-modal>
    }
  `,
})
export class Planes implements OnInit {
  private api = inject(PlanService);
  private notif = inject(NotificacionService);

  protected planes = signal<Plan[]>([]);
  protected cargando = signal(true);
  protected error = signal<string | null>(null);
  protected seleccionado = signal<Plan | null>(null);
  protected guardando = signal(false);

  protected form = inject(FormBuilder).nonNullable.group({
    precio: [0, [Validators.required, Validators.min(1), Validators.max(1000)]],
    descripcion: ['', Validators.maxLength(255)],
  });

  protected err(c: string) {
    return errorDe(this.form.get(c));
  }

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.api.listar().subscribe({
      next: (p) => {
        this.planes.set(p);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(mensajeError(e));
        this.cargando.set(false);
      },
    });
  }

  editar(p: Plan): void {
    this.form.reset({ precio: p.precio, descripcion: p.descripcion ?? '' });
    this.seleccionado.set(p);
  }

  guardar(): void {
    const p = this.seleccionado();
    if (!p) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    const v = this.form.getRawValue();
    this.api.actualizar(p.tipo, { precio: v.precio, descripcion: v.descripcion || null }).subscribe({
      next: () => {
        this.notif.exito(`${p.nombre} actualizado`);
        this.guardando.set(false);
        this.seleccionado.set(null);
        this.cargar();
      },
      error: (e) => {
        aplicarErroresApi(this.form, e);
        this.notif.error(mensajeError(e));
        this.guardando.set(false);
      },
    });
  }
}
