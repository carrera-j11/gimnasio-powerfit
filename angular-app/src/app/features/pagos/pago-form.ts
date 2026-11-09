import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, input, OnInit, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Membresia, METODOS_PAGO, MetodoPago, Pago } from '../../core/models';
import { MembresiaService, PagoService } from '../../core/services/api.services';
import { NotificacionService } from '../../core/services/notificacion.service';
import { EtiquetaPipe, Modal } from '../../shared/ui';
import { aplicarErroresApi, errorDe, mensajeError } from '../../shared/utils';
import { A11Y } from '../../shared/a11y';

/**
 * Registrar (POST /pagos) o corregir (PUT /pagos/{id}) un pago.
 * Muestra el saldo de la membresía elegida y exige referencia si el método es TRANSFERENCIA.
 */
@Component({
  selector: 'app-pago-form',
  imports: [...A11Y, ReactiveFormsModule, CurrencyPipe, EtiquetaPipe, Modal],
  template: `
    <app-modal [titulo]="pago() ? 'Corregir pago #' + pago()!.id : paraMi() ? 'Pagar mi membresía' : 'Registrar pago'" (cerrar)="cerrar.emit()">
      <form [formGroup]="form" (ngSubmit)="guardar()" novalidate>
        <label class="campo"><span>Membresía</span>
          <select id="pf-membresia" formControlName="membresiaId">
            <option [ngValue]="null" disabled>Seleccione una membresía…</option>
            @for (m of opciones(); track m.id) {
              <option [ngValue]="m.id">#{{ m.id }} · {{ paraMi() ? m.fechaInicio + ' a ' + m.fechaFin : m.socioNombre }} · {{ m.planNombre }} · saldo {{ m.saldoPendiente | currency: 'USD' }}</option>
            }
          </select>
          @if (err('membresiaId'); as e) { <small class="err">{{ e }}</small> }
        </label>

        @if (seleccionada(); as m) {
          <div class="resumen-saldo">
            <div><span class="etq">Precio</span><strong>{{ m.precioPlan | currency: 'USD' }}</strong></div>
            <div><span class="etq">Pagado</span><strong>{{ m.totalPagado | currency: 'USD' }}</strong></div>
            <div><span class="etq">Saldo</span><strong [class.texto-peligro]="m.saldoPendiente > 0">{{ m.saldoPendiente | currency: 'USD' }}</strong></div>
          </div>
        }

        <div class="rejilla-2">
          <label class="campo"><span>Monto (USD)</span>
            <input id="pf-monto" type="number" step="0.01" min="0.01" formControlName="monto" />
            @if (err('monto'); as e) { <small class="err">{{ e }}</small> }
          </label>
          <label class="campo"><span>Método de pago</span>
            <select id="pf-metodo" formControlName="metodoPago">
              @for (mp of metodos(); track mp) { <option [value]="mp">{{ mp | etiqueta }}</option> }
            </select>
          </label>
        </div>
        @if (paraMi()) {
          <p class="texto-suave">En línea puedes pagar con tarjeta o transferencia. El efectivo se paga en recepción.</p>
        }
        <label class="campo"><span>Referencia {{ form.controls.metodoPago.value === 'TRANSFERENCIA' ? '(obligatoria)' : '(opcional)' }}</span>
          <input id="pf-referencia" formControlName="referencia" maxlength="50" placeholder="N.º de comprobante o transferencia" />
          @if (err('referencia'); as e) { <small class="err">{{ e }}</small> }
        </label>
        @if (error()) { <div class="alerta alerta-error" role="alert">{{ error() }}</div> }
        <div class="acciones">
          <button type="button" class="btn" (click)="cerrar.emit()">Volver</button>
          <button type="submit" class="btn btn-primario" [disabled]="guardando()">{{ guardando() ? 'Procesando…' : paraMi() ? 'Pagar' : 'Guardar pago' }}</button>
        </div>
      </form>
    </app-modal>
  `,
})
export class PagoForm implements OnInit {
  /** Membresías entre las que elegir (si no se pasa, se cargan todas las no canceladas). */
  membresias = input<Membresia[] | null>(null);
  membresiaId = input<number | null>(null);
  pago = input<Pago | null>(null);
  /** El SOCIO paga su propia membresía (POST /pagos/pagar, sin efectivo). */
  paraMi = input(false);
  guardado = output<Pago>();
  cerrar = output<void>();

  private api = inject(PagoService);
  private membresiasApi = inject(MembresiaService);
  private notif = inject(NotificacionService);

  protected metodos = computed<MetodoPago[]>(() => (this.paraMi() ? ['TARJETA', 'TRANSFERENCIA'] : METODOS_PAGO));
  protected opciones = signal<Membresia[]>([]);
  protected idSel = signal<number | null>(null);
  protected seleccionada = computed(() => this.opciones().find((m) => m.id === this.idSel()) ?? null);
  protected guardando = signal(false);
  protected error = signal<string | null>(null);

  protected form = inject(FormBuilder).group({
    membresiaId: [null as number | null, Validators.required],
    monto: [null as number | null, [Validators.required, Validators.min(0.01), Validators.max(9999.99)]],
    metodoPago: ['EFECTIVO' as MetodoPago, Validators.required],
    referencia: ['', Validators.maxLength(50)],
  });

  constructor() {
    this.form.controls.membresiaId.valueChanges.subscribe((id) => {
      this.idSel.set(id);
      const m = this.opciones().find((x) => x.id === id);
      if (m && !this.pago() && m.saldoPendiente > 0) this.form.controls.monto.setValue(m.saldoPendiente);
    });
    this.form.controls.metodoPago.valueChanges.subscribe((mp) => {
      const ref = this.form.controls.referencia;
      ref.setValidators(mp === 'TRANSFERENCIA' ? [Validators.required, Validators.maxLength(50)] : [Validators.maxLength(50)]);
      ref.updateValueAndValidity();
    });
  }

  protected err(c: string) {
    return errorDe(this.form.get(c));
  }

  ngOnInit(): void {
    if (this.paraMi()) this.form.controls.metodoPago.setValue('TARJETA');
    const dadas = this.membresias();
    if (dadas) {
      this.iniciar(dadas);
    } else {
      this.membresiasApi.listar().subscribe((l) => this.iniciar(l));
    }
  }

  private iniciar(lista: Membresia[]): void {
    const p = this.pago();
    // Para pagos nuevos solo sirven membresías no canceladas con saldo
    const filtradas = p ? lista : lista.filter((m) => m.estado !== 'CANCELADA' && m.saldoPendiente > 0);
    this.opciones.set(filtradas);
    if (p) {
      this.form.patchValue({ membresiaId: p.membresiaId, monto: p.monto, metodoPago: p.metodoPago, referencia: p.referencia ?? '' });
      this.form.controls.membresiaId.disable();
    } else if (this.membresiaId()) {
      this.form.patchValue({ membresiaId: this.membresiaId() });
    }
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set(null);
      return;
    }
    const v = this.form.getRawValue();
    const dto = { membresiaId: v.membresiaId!, monto: Number(v.monto), metodoPago: v.metodoPago!, referencia: v.referencia || null };
    this.guardando.set(true);
    this.error.set(null);
    const p = this.pago();
    const peticion = p ? this.api.actualizar(p.id, dto) : this.paraMi() ? this.api.pagar(dto) : this.api.crear(dto);
    peticion.subscribe({
      next: (r) => {
        this.notif.exito(p ? 'Pago corregido' : `Pago de $${r.monto} registrado`);
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
