import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Usuario } from '../../core/models';
import { UsuarioAdminService } from '../../core/services/api.services';
import { AuthService } from '../../core/services/auth.service';
import { NotificacionService } from '../../core/services/notificacion.service';
import { Badge, Estado, EtiquetaPipe, Modal } from '../../shared/ui';
import { aplicarErroresApi, errorDe, mensajeError } from '../../shared/utils';
import { A11Y } from '../../shared/a11y';

/** El ADMIN aprueba o rechaza las cuentas que ya verificaron su correo. */
@Component({
  selector: 'app-solicitudes',
  imports: [...A11Y, ReactiveFormsModule, DatePipe, Badge, Estado, EtiquetaPipe, Modal],
  template: `
    <div class="cabecera">
      <div><p class="sobre">Administración</p><h1>Solicitudes de cuenta</h1></div>
      <button type="button" class="btn" (click)="cargar()">Actualizar</button>
    </div>
    <p class="texto-suave">Aquí aparecen las personas que ya verificaron su correo. Apruebe o rechace cada cuenta; el resultado se le envía por correo. Las solicitudes de nuevos administradores (máximo 3 en total) solo las revisa el administrador principal.</p>

    <app-estado [cargando]="cargando()" [error]="error()" [vacio]="!cargando() && !lista().length" textoVacio="No hay solicitudes pendientes." />

    @if (lista().length) {
      <div class="tabla-cont"><table class="tabla">
        <thead><tr><th>#</th><th>Nombre</th><th>Cédula</th><th>Email</th><th>Rol</th><th>Estado</th><th>Registro</th><th></th></tr></thead>
        <tbody>
          @for (u of lista(); track u.id) {
            <tr>
              <td class="num">{{ u.id }}</td>
              <td>{{ u.nombres }} {{ u.apellidos }}</td>
              <td>{{ u.cedula }}</td>
              <td>{{ u.email }}</td>
              <td>{{ u.rol | etiqueta }}</td>
              <td><app-badge [valor]="u.estado" /></td>
              <td>{{ u.fechaRegistro | date: 'dd/MM/yyyy HH:mm' }}</td>
              <td class="acciones-fila">
                @if (u.rol !== 'ADMIN' || soyPrincipal()) {
                  <button type="button" class="btn btn-sm btn-primario" (click)="abrir(u)">Revisar</button>
                  <button type="button" class="btn btn-sm btn-peligro-txt" (click)="eliminar(u)">Eliminar</button>
                } @else {
                  <small class="texto-suave">Lo revisa el administrador principal</small>
                }
              </td>
            </tr>
          }
        </tbody>
      </table></div>
    }

    @if (seleccionado(); as u) {
      <app-modal [titulo]="'Revisar cuenta de ' + u.nombres + ' ' + u.apellidos" (cerrar)="seleccionado.set(null)">
        <dl class="datos datos-compacto">
          <div><dt>Rol solicitado</dt><dd>{{ u.rol | etiqueta }}</dd></div>
          <div><dt>Cédula</dt><dd>{{ u.cedula }}</dd></div>
          <div><dt>Email</dt><dd>{{ u.email }}</dd></div>
          <div><dt>Celular</dt><dd>{{ u.celular }}</dd></div>
          <div><dt>Edad</dt><dd>{{ u.edad }} años</dd></div>
        </dl>
        <form [formGroup]="form" (ngSubmit)="enviar()" novalidate>
          <div class="campo">
            <span id="rev-decision-etq">Decisión</span>
            <div class="opciones-plan opciones-decision" role="radiogroup" aria-labelledby="rev-decision-etq">
              <button type="button" id="rev-aprobar" class="opcion-plan" role="radio" [class.sel]="decision() === 1"
                [attr.aria-checked]="decision() === 1" (click)="elegirDecision(1)"><strong>Aprobar</strong><span>La persona podrá iniciar sesión</span></button>
              <button type="button" id="rev-rechazar" class="opcion-plan" role="radio" [class.sel]="decision() === 2"
                [attr.aria-checked]="decision() === 2" (click)="elegirDecision(2)"><strong>Rechazar</strong><span>Se le enviará el motivo</span></button>
            </div>
          </div>
          @if (decision() === 2) {
            <label class="campo">
              <span>Motivo del rechazo</span>
              <textarea id="rev-motivo" formControlName="motivo" rows="3" maxlength="255"></textarea>
              @if (err('motivo'); as e) { <small class="err">{{ e }}</small> }
            </label>
          }
          @if (errorModal()) { <div class="alerta alerta-error" role="alert">{{ errorModal() }}</div> }
          <div class="acciones">
            <button type="button" class="btn" (click)="seleccionado.set(null)">Volver</button>
            <button type="submit" class="btn" [class.btn-primario]="decision() === 1"
              [class.btn-peligro]="decision() === 2" [disabled]="guardando()">
              {{ guardando() ? 'Enviando…' : decision() === 1 ? 'Aprobar cuenta' : 'Rechazar cuenta' }}
            </button>
          </div>
        </form>
      </app-modal>
    }
  `,
})
export class Solicitudes implements OnInit {
  private api = inject(UsuarioAdminService);
  private notif = inject(NotificacionService);
  private auth = inject(AuthService);
  protected soyPrincipal = computed(() => this.auth.usuario()?.adminPrincipal === true);

  protected lista = signal<Usuario[]>([]);
  protected cargando = signal(true);
  protected error = signal<string | null>(null);
  protected seleccionado = signal<Usuario | null>(null);
  protected guardando = signal(false);
  protected errorModal = signal<string | null>(null);

  protected form = inject(FormBuilder).nonNullable.group({
    decision: [1 as 1 | 2],
    motivo: ['', Validators.maxLength(255)],
  });

  protected decision = signal<1 | 2>(1);

  protected err(c: string) {
    return errorDe(this.form.get(c));
  }

  protected elegirDecision(d: 1 | 2): void {
    this.decision.set(d);
    this.form.controls.decision.setValue(d);
  }

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.api.pendientes().subscribe({
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

  abrir(u: Usuario): void {
    this.form.reset({ decision: 1, motivo: '' });
    this.decision.set(1);
    this.errorModal.set(null);
    this.seleccionado.set(u);
  }

  enviar(): void {
    const u = this.seleccionado();
    if (!u) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorModal.set(null);
      return;
    }
    const v = this.form.getRawValue();
    this.guardando.set(true);
    this.errorModal.set(null);
    this.api.revisar(u.id, { decision: v.decision, motivo: v.decision === 2 ? v.motivo || null : null }).subscribe({
      next: (r) => {
        this.notif.exito(`Cuenta de ${r.nombres} ${r.estado === 'APROBADA' ? 'aprobada' : 'rechazada'}. Se le envió un correo.`);
        this.guardando.set(false);
        this.seleccionado.set(null);
        this.cargar();
      },
      error: (e) => {
        aplicarErroresApi(this.form, e);
        this.errorModal.set(mensajeError(e));
        this.guardando.set(false);
      },
    });
  }

  async eliminar(u: Usuario): Promise<void> {
    const ok = await this.notif.confirmar('Eliminar solicitud', `¿Eliminar la cuenta pendiente de ${u.nombres} ${u.apellidos}? Esta acción no se puede deshacer.`);
    if (!ok) return;
    this.api.eliminar(u.id).subscribe({
      next: () => {
        this.notif.exito('Solicitud eliminada');
        this.cargar();
      },
      error: (e) => this.notif.error(mensajeError(e)),
    });
  }
}
