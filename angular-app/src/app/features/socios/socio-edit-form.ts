import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Socio } from '../../core/models';
import { SocioService } from '../../core/services/api.services';
import { NotificacionService } from '../../core/services/notificacion.service';
import { Modal } from '../../shared/ui';
import { aplicarErroresApi, celular, errorDe, mensajeError, soloLetras } from '../../shared/utils';
import { A11Y } from '../../shared/a11y';

/** PUT /socios/{id}: nombres, apellidos, celular y objetivo (la cédula y el email no se cambian). */
@Component({
  selector: 'app-socio-edit-form',
  imports: [...A11Y, ReactiveFormsModule, Modal],
  template: `
    <app-modal [titulo]="'Editar socio: ' + socio().cedula" (cerrar)="cerrar.emit()">
      <form [formGroup]="form" (ngSubmit)="guardar()" novalidate>
        <div class="rejilla-2">
          <label class="campo"><span>Nombres</span><input id="se-nombres" formControlName="nombres" />
            @if (err('nombres'); as e) { <small class="err">{{ e }}</small> }</label>
          <label class="campo"><span>Apellidos</span><input id="se-apellidos" formControlName="apellidos" />
            @if (err('apellidos'); as e) { <small class="err">{{ e }}</small> }</label>
          <label class="campo"><span>Celular</span><input id="se-celular" formControlName="celular" maxlength="10" />
            @if (err('celular'); as e) { <small class="err">{{ e }}</small> }</label>
          <label class="campo"><span>Objetivo</span><input id="se-objetivo" formControlName="objetivo" maxlength="150" />
            @if (err('objetivo'); as e) { <small class="err">{{ e }}</small> }</label>
        </div>
        @if (error()) { <div class="alerta alerta-error" role="alert">{{ error() }}</div> }
        <div class="acciones">
          <button type="button" class="btn" (click)="cerrar.emit()">Volver</button>
          <button type="submit" class="btn btn-primario" [disabled]="guardando()">{{ guardando() ? 'Guardando…' : 'Guardar' }}</button>
        </div>
      </form>
    </app-modal>
  `,
})
export class SocioEditForm implements OnInit {
  socio = input.required<Socio>();
  guardado = output<Socio>();
  cerrar = output<void>();

  private api = inject(SocioService);
  private notif = inject(NotificacionService);
  protected guardando = signal(false);
  protected error = signal<string | null>(null);

  protected form = inject(FormBuilder).nonNullable.group({
    nombres: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50), soloLetras]],
    apellidos: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50), soloLetras]],
    celular: ['', [Validators.required, celular]],
    objetivo: ['', Validators.maxLength(150)],
  });

  protected err(c: string) {
    return errorDe(this.form.get(c));
  }

  ngOnInit(): void {
    const s = this.socio();
    this.form.setValue({ nombres: s.nombres, apellidos: s.apellidos, celular: s.celular, objetivo: s.objetivo ?? '' });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set(null);
      return;
    }
    const v = this.form.getRawValue();
    this.guardando.set(true);
    this.api.actualizar(this.socio().id, { ...v, objetivo: v.objetivo || null }).subscribe({
      next: (r) => {
        this.notif.exito('Socio actualizado');
        this.guardando.set(false);
        this.guardado.emit(r);
      },
      error: (e) => {
        aplicarErroresApi(this.form, e);
        this.error.set(mensajeError(e));
        this.guardando.set(false);
      },
    });
  }
}
