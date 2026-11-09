import { CurrencyPipe } from '@angular/common';
import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Membresia, Plan, Socio, TipoPlan } from '../../core/models';
import { MembresiaService, PlanService, SocioService } from '../../core/services/api.services';
import { NotificacionService } from '../../core/services/notificacion.service';
import { Modal } from '../../shared/ui';
import { aplicarErroresApi, errorDe, hoyISO, mensajeError } from '../../shared/utils';
import { A11Y } from '../../shared/a11y';

/**
 * Crear o editar una membresía.
 * - paraMi: el SOCIO contrata su propia membresía (POST /membresias/contratar).
 * - socioId fijo: ADMIN/RECEPCIONISTA la crean para ese socio (POST /membresias).
 * - membresia: modo edición (PUT /membresias/{id}; solo plan y fecha de inicio).
 */
@Component({
  selector: 'app-membresia-form',
  imports: [...A11Y, ReactiveFormsModule, CurrencyPipe, Modal],
  template: `
    <app-modal [titulo]="titulo()" (cerrar)="cerrar.emit()">
      <form [formGroup]="form" (ngSubmit)="guardar()" novalidate>
        @if (membresia(); as m) {
          <p class="texto-suave">Socio: <strong>{{ m.socioNombre }}</strong>. Solo se puede cambiar el plan si la membresía no tiene pagos.</p>
        } @else if (!socioId() && !paraMi()) {
          <label class="campo"><span>Socio</span>
            <select id="mf-socio" formControlName="socioId">
              <option [ngValue]="null" disabled>Seleccione un socio…</option>
              @for (s of socios(); track s.id) {
                <option [ngValue]="s.id">{{ s.apellidos }} {{ s.nombres }} · {{ s.cedula }}{{ s.membresiaVigente ? ' · ya tiene membresía vigente' : '' }}</option>
              }
            </select>
            @if (err('socioId'); as e) { <small class="err">{{ e }}</small> }
          </label>
        }

        <div class="campo">
          <span id="mf-plan-etq">Plan</span>
          <div class="opciones-plan" role="radiogroup" aria-labelledby="mf-plan-etq">
            @for (p of planes(); track p.id) {
              <button type="button" class="opcion-plan" role="radio" [id]="'mf-plan-' + p.tipo"
                [class.sel]="plan() === p.tipo" [attr.aria-checked]="plan() === p.tipo" (click)="elegirPlan(p.tipo)">
                <strong>{{ p.nombre }}</strong>
                <span>{{ p.precio | currency: 'USD' }} · {{ p.duracionDias }} días</span>
              </button>
            }
          </div>
        </div>

        <label class="campo"><span>Fecha de inicio</span>
          <input id="mf-fecha" type="date" formControlName="fechaInicio" [min]="minFecha" [max]="maxFecha" />
          @if (err('fechaInicio'); as e) { <small class="err">{{ e }}</small> }
          @else { <small class="ayuda">Entre hoy y 30 días. La fecha de fin se calcula según el plan.</small> }
        </label>
        @if (paraMi()) {
          <p class="texto-suave">Después de contratarla podrás pagarla en línea con tarjeta o transferencia, o en efectivo en recepción.</p>
        }
        @if (error()) { <div class="alerta alerta-error" role="alert">{{ error() }}</div> }
        <div class="acciones">
          <button type="button" class="btn" (click)="cerrar.emit()">Volver</button>
          <button type="submit" class="btn btn-primario" [disabled]="guardando()">
            {{ guardando() ? 'Guardando…' : paraMi() ? 'Contratar membresía' : 'Guardar membresía' }}
          </button>
        </div>
      </form>
    </app-modal>
  `,
})
export class MembresiaForm implements OnInit {
  paraMi = input(false);
  socioId = input<number | null>(null);
  membresia = input<Membresia | null>(null);
  guardado = output<Membresia>();
  cerrar = output<void>();

  private api = inject(MembresiaService);
  private planesApi = inject(PlanService);
  private sociosApi = inject(SocioService);
  private notif = inject(NotificacionService);

  protected minFecha = hoyISO();
  protected maxFecha = hoyISO(30);
  protected planes = signal<Plan[]>([]);
  protected socios = signal<Socio[]>([]);
  protected plan = signal<TipoPlan>('MENSUAL');
  protected guardando = signal(false);
  protected error = signal<string | null>(null);

  protected form = inject(FormBuilder).group({
    socioId: [null as number | null],
    tipoPlan: ['MENSUAL' as TipoPlan, Validators.required],
    fechaInicio: [hoyISO(), Validators.required],
  });

  protected titulo() {
    const m = this.membresia();
    if (m) return `Editar membresía #${m.id}`;
    return this.paraMi() ? 'Contratar membresía' : 'Nueva membresía';
  }

  protected err(c: string) {
    return errorDe(this.form.get(c));
  }

  protected elegirPlan(tipo: TipoPlan): void {
    this.plan.set(tipo);
    this.form.controls.tipoPlan.setValue(tipo);
  }

  ngOnInit(): void {
    this.planesApi.listar().subscribe((p) => this.planes.set(p));
    const m = this.membresia();
    if (m) {
      this.form.patchValue({ fechaInicio: m.fechaInicio });
      this.elegirPlan(m.tipoPlan);
    } else if (this.socioId()) {
      this.form.patchValue({ socioId: this.socioId() });
    } else if (!this.paraMi()) {
      this.form.controls.socioId.setValidators(Validators.required);
      this.sociosApi.listar().subscribe((s) =>
        this.socios.set(s.filter((x) => x.estadoCuenta === 'APROBADA').sort((a, b) => a.apellidos.localeCompare(b.apellidos))),
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
    const m = this.membresia();
    const plan = { tipoPlan: this.plan(), fechaInicio: v.fechaInicio };
    const peticion = m
      ? this.api.actualizar(m.id, plan)
      : this.paraMi()
        ? this.api.contratar(plan)
        : this.api.crear({ socioId: v.socioId!, ...plan });
    peticion.subscribe({
      next: (r) => {
        this.notif.exito(m ? 'Membresía actualizada' : `Membresía ${r.planNombre} contratada hasta ${r.fechaFin}`);
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
