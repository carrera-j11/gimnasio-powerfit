import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Clase, DIAS, DiaSemana, Entrenador } from '../../core/models';
import { ClaseService, EntrenadorService } from '../../core/services/api.services';
import { AuthService } from '../../core/services/auth.service';
import { NotificacionService } from '../../core/services/notificacion.service';
import { EtiquetaPipe, Modal } from '../../shared/ui';
import { aplicarErroresApi, errorDe, mensajeError } from '../../shared/utils';
import { A11Y } from '../../shared/a11y';

const minutos = (h: string) => Number(h.substring(0, 2)) * 60 + Number(h.substring(3, 5));

/** Valida las reglas de la API: horario 06:00–22:00 y duración de 30 a 180 minutos. */
function horarioValido(g: AbstractControl): ValidationErrors | null {
  const ini: string = g.get('horaInicio')?.value;
  const fin: string = g.get('horaFin')?.value;
  if (!ini || !fin) return null;
  const a = minutos(ini);
  const b = minutos(fin);
  if (a < 360 || b > 1320) return { horario: 'La clase debe estar entre las 06:00 y las 22:00' };
  if (b <= a) return { horario: 'La hora de fin debe ser posterior a la de inicio' };
  if (b - a < 30 || b - a > 180) return { horario: `La duración debe ser de 30 a 180 minutos (ahora ${b - a})` };
  return null;
}

/**
 * Crear o editar una clase.
 * - ENTRENADOR: la clase queda a su nombre (no envía entrenadorId).
 * - ADMIN: elige el entrenador encargado.
 */
@Component({
  selector: 'app-clase-form',
  imports: [...A11Y, ReactiveFormsModule, EtiquetaPipe, Modal],
  template: `
    <app-modal [titulo]="clase() ? 'Editar clase' : 'Nueva clase'" (cerrar)="cerrar.emit()">
      <form [formGroup]="form" (ngSubmit)="guardar()" novalidate>
        <label class="campo"><span>Nombre</span><input id="cf-nombre" formControlName="nombre" maxlength="50" placeholder="Ej. Spinning intermedio" />
          @if (err('nombre'); as e) { <small class="err">{{ e }}</small> }</label>
        <label class="campo"><span>Descripción (opcional)</span><textarea id="cf-descripcion" formControlName="descripcion" rows="2" maxlength="255"></textarea></label>
        <div class="rejilla-2">
          <label class="campo"><span>Día</span>
            <select id="cf-dia" formControlName="diaSemana">
              @for (d of dias; track d) { <option [value]="d">{{ d | etiqueta }}</option> }
            </select></label>
          <label class="campo"><span>Cupo máximo</span><input id="cf-cupo" type="number" min="1" max="30" formControlName="cupoMaximo" />
            @if (err('cupoMaximo'); as e) { <small class="err">{{ e }}</small> }</label>
          <label class="campo"><span>Hora de inicio</span><input id="cf-inicio" type="time" min="06:00" max="22:00" formControlName="horaInicio" />
            @if (err('horaInicio'); as e) { <small class="err">{{ e }}</small> }</label>
          <label class="campo"><span>Hora de fin</span><input id="cf-fin" type="time" min="06:00" max="22:00" formControlName="horaFin" />
            @if (err('horaFin'); as e) { <small class="err">{{ e }}</small> }</label>
        </div>
        @if (form.errors?.['horario'] && (form.touched || form.dirty)) { <small class="err bloque-err">{{ form.errors?.['horario'] }}</small> }
        @if (esAdmin) {
          <label class="campo"><span>Entrenador encargado</span>
            <select id="cf-entrenador" formControlName="entrenadorId">
              <option [ngValue]="null" disabled>Seleccione…</option>
              @for (e of entrenadores(); track e.id) { <option [ngValue]="e.id">{{ e.nombres }} {{ e.apellidos }} · {{ e.especialidad }}</option> }
            </select>
            @if (err('entrenadorId'); as e) { <small class="err">{{ e }}</small> }</label>
        }
        @if (error()) { <div class="alerta alerta-error" role="alert">{{ error() }}</div> }
        <div class="acciones">
          <button type="button" class="btn" (click)="cerrar.emit()">Volver</button>
          <button type="submit" class="btn btn-primario" [disabled]="guardando()">{{ guardando() ? 'Guardando…' : 'Guardar clase' }}</button>
        </div>
      </form>
    </app-modal>
  `,
})
export class ClaseForm implements OnInit {
  clase = input<Clase | null>(null);
  diaInicial = input<DiaSemana | null>(null);
  guardado = output<Clase>();
  cerrar = output<void>();

  private api = inject(ClaseService);
  private entrenadoresApi = inject(EntrenadorService);
  private notif = inject(NotificacionService);
  protected esAdmin = inject(AuthService).tieneRol('ADMIN');

  protected dias = DIAS;
  protected entrenadores = signal<Entrenador[]>([]);
  protected guardando = signal(false);
  protected error = signal<string | null>(null);

  protected form = inject(FormBuilder).group(
    {
      nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      descripcion: ['', Validators.maxLength(255)],
      diaSemana: ['LUNES' as DiaSemana, Validators.required],
      horaInicio: ['07:00', Validators.required],
      horaFin: ['08:00', Validators.required],
      cupoMaximo: [15 as number | null, [Validators.required, Validators.min(1), Validators.max(30)]],
      entrenadorId: [null as number | null],
    },
    { validators: horarioValido },
  );

  protected err(c: string) {
    return errorDe(this.form.get(c));
  }

  ngOnInit(): void {
    if (this.esAdmin) {
      this.form.controls.entrenadorId.setValidators(Validators.required);
      this.entrenadoresApi.listar().subscribe((l) => this.entrenadores.set(l));
    }
    const c = this.clase();
    if (c) {
      this.form.patchValue({
        nombre: c.nombre,
        descripcion: c.descripcion ?? '',
        diaSemana: c.diaSemana,
        horaInicio: c.horaInicio.substring(0, 5),
        horaFin: c.horaFin.substring(0, 5),
        cupoMaximo: c.cupoMaximo,
        entrenadorId: c.entrenadorId,
      });
    } else if (this.diaInicial()) {
      this.form.patchValue({ diaSemana: this.diaInicial()! });
    }
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set(null);
      return;
    }
    const v = this.form.getRawValue();
    const dto = {
      nombre: v.nombre!.trim(),
      descripcion: v.descripcion?.trim() || null,
      diaSemana: v.diaSemana!,
      horaInicio: v.horaInicio!,
      horaFin: v.horaFin!,
      cupoMaximo: Number(v.cupoMaximo),
      entrenadorId: this.esAdmin ? v.entrenadorId : null,
    };
    this.guardando.set(true);
    this.error.set(null);
    const c = this.clase();
    (c ? this.api.actualizar(c.id, dto) : this.api.crear(dto)).subscribe({
      next: (r) => {
        this.notif.exito(c ? 'Clase actualizada' : `Clase "${r.nombre}" creada`);
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
