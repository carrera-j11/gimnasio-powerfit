import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Clase, Inscripcion, Socio } from '../../core/models';
import { ClaseService, InscripcionService, SocioService } from '../../core/services/api.services';
import { NotificacionService } from '../../core/services/notificacion.service';
import { EtiquetaPipe, HoraPipe, Modal } from '../../shared/ui';
import { aplicarErroresApi, errorDe, mensajeError } from '../../shared/utils';
import { A11Y } from '../../shared/a11y';

/** ADMIN o RECEPCIONISTA inscriben a un socio en una clase (POST /inscripciones con socioId y claseId). */
@Component({
  selector: 'app-inscripcion-form',
  imports: [...A11Y, ReactiveFormsModule, EtiquetaPipe, HoraPipe, Modal],
  template: `
    <app-modal titulo="Inscribir socio en clase" (cerrar)="cerrar.emit()">
      <form [formGroup]="form" (ngSubmit)="guardar()" novalidate>
        @if (!socioId()) {
          <label class="campo"><span>Socio</span>
            <select id="if-socio" formControlName="socioId">
              <option [ngValue]="null" disabled>Seleccione un socio…</option>
              @for (s of socios(); track s.id) {
                <option [ngValue]="s.id">{{ s.apellidos }} {{ s.nombres }} · {{ s.cedula }}</option>
              }
            </select>
            @if (err('socioId'); as e) { <small class="err">{{ e }}</small> }
            <small class="ayuda">Solo aparecen socios con membresía vigente.</small>
          </label>
        }
        <label class="campo"><span>Clase</span>
          <select id="if-clase" formControlName="claseId">
            <option [ngValue]="null" disabled>Seleccione una clase…</option>
            @for (c of clases(); track c.id) {
              <option [ngValue]="c.id" [disabled]="c.cuposDisponibles <= 0">
                {{ c.diaSemana | etiqueta }} {{ c.horaInicio | hora }} · {{ c.nombre }} · {{ c.entrenadorNombre }} · {{ c.cuposDisponibles }} cupos
              </option>
            }
          </select>
          @if (err('claseId'); as e) { <small class="err">{{ e }}</small> }
        </label>
        @if (error()) { <div class="alerta alerta-error" role="alert">{{ error() }}</div> }
        <div class="acciones">
          <button type="button" class="btn" (click)="cerrar.emit()">Volver</button>
          <button type="submit" class="btn btn-primario" [disabled]="guardando()">{{ guardando() ? 'Inscribiendo…' : 'Inscribir' }}</button>
        </div>
      </form>
    </app-modal>
  `,
})
export class InscripcionForm implements OnInit {
  socioId = input<number | null>(null);
  claseId = input<number | null>(null);
  guardado = output<Inscripcion>();
  cerrar = output<void>();

  private api = inject(InscripcionService);
  private clasesApi = inject(ClaseService);
  private sociosApi = inject(SocioService);
  private notif = inject(NotificacionService);

  protected socios = signal<Socio[]>([]);
  protected clases = signal<Clase[]>([]);
  protected guardando = signal(false);
  protected error = signal<string | null>(null);

  protected form = inject(FormBuilder).group({
    socioId: [null as number | null, Validators.required],
    claseId: [null as number | null, Validators.required],
  });

  protected err(c: string) {
    return errorDe(this.form.get(c));
  }

  ngOnInit(): void {
    this.form.patchValue({ socioId: this.socioId(), claseId: this.claseId() });
    const orden = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];
    this.clasesApi.listar().subscribe((c) =>
      this.clases.set(c.sort((a, b) => orden.indexOf(a.diaSemana) - orden.indexOf(b.diaSemana) || a.horaInicio.localeCompare(b.horaInicio))),
    );
    if (!this.socioId()) {
      this.sociosApi.listar().subscribe((s) =>
        this.socios.set(s.filter((x) => x.membresiaVigente).sort((a, b) => a.apellidos.localeCompare(b.apellidos))),
      );
    }
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set(null);
      return;
    }
    const v = this.form.getRawValue();
    this.guardando.set(true);
    this.error.set(null);
    this.api.crear({ socioId: v.socioId!, claseId: v.claseId! }).subscribe({
      next: (r) => {
        this.notif.exito(`${r.socioNombre} inscrito en ${r.claseNombre}`);
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
