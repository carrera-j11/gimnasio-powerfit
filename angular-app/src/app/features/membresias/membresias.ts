import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EstadoMembresia, Membresia } from '../../core/models';
import { MembresiaService } from '../../core/services/api.services';
import { AuthService } from '../../core/services/auth.service';
import { NotificacionService } from '../../core/services/notificacion.service';
import { Badge, Estado } from '../../shared/ui';
import { mensajeError, normalizar } from '../../shared/utils';
import { PagoForm } from '../pagos/pago-form';
import { MembresiaForm } from './membresia-form';
import { A11Y } from '../../shared/a11y';

/** Gestión de membresías: crear, editar, cancelar (PATCH), eliminar (solo ADMIN) y pagar. */
@Component({
  selector: 'app-membresias',
  imports: [...A11Y, FormsModule, RouterLink, CurrencyPipe, Badge, Estado, MembresiaForm, PagoForm],
  template: `
    <div class="cabecera">
      <div><p class="sobre">Recepción</p><h1>Membresías</h1></div>
      <button type="button" class="btn btn-primario" (click)="nueva()">Nueva membresía</button>
    </div>

    <div class="filtros">
      <label class="campo campo-linea campo-crece"><span>Buscar</span>
        <input id="mem-buscar" [(ngModel)]="texto" placeholder="Socio o cédula" />
      </label>
      <label class="campo campo-linea"><span>Estado</span>
        <select id="mem-estado" [(ngModel)]="estado">
          <option value="">Todos</option>
          <option value="ACTIVA">Activa</option>
          <option value="VENCIDA">Vencida</option>
          <option value="CANCELADA">Cancelada</option>
        </select>
      </label>
      <label class="check"><input id="mem-saldo" type="checkbox" [(ngModel)]="conSaldo" /> Solo con saldo pendiente</label>
    </div>

    <app-estado [cargando]="cargando()" [error]="error()" [vacio]="!cargando() && !filtradas().length" />

    @if (filtradas().length) {
      <div class="tabla-cont"><table class="tabla">
        <thead><tr><th>#</th><th>Socio</th><th>Plan</th><th>Inicio</th><th>Fin</th><th>Estado</th><th class="num">Pagado</th><th class="num">Saldo</th><th></th></tr></thead>
        <tbody>
          @for (m of filtradas(); track m.id) {
            <tr>
              <td class="num">{{ m.id }}</td>
              <td><a [routerLink]="['/socios', m.socioId]" class="enlace-fuerte">{{ m.socioNombre }}</a><br /><small class="texto-suave">{{ m.socioCedula }}</small></td>
              <td>{{ m.planNombre }}<br /><small class="texto-suave">{{ m.precioPlan | currency: 'USD' }}</small></td>
              <td>{{ m.fechaInicio }}</td>
              <td>{{ m.fechaFin }}</td>
              <td><app-badge [valor]="m.estado" /></td>
              <td class="num">{{ m.totalPagado | currency: 'USD' }}</td>
              <td class="num" [class.texto-peligro]="m.saldoPendiente > 0">{{ m.saldoPendiente | currency: 'USD' }}</td>
              <td class="acciones-fila">
                @if (m.estado !== 'CANCELADA') {
                  @if (m.saldoPendiente > 0) { <button type="button" class="btn btn-sm btn-primario" (click)="pagando.set(m)">Pagar</button> }
                  <button type="button" class="btn btn-sm" (click)="editando.set(m)">Editar</button>
                  <button type="button" class="btn btn-sm btn-peligro-txt" (click)="cancelar(m)">Cancelar</button>
                }
                @if (esAdmin) {
                  <button type="button" class="btn btn-sm btn-peligro-txt" (click)="eliminar(m)">Eliminar</button>
                }
              </td>
            </tr>
          }
        </tbody>
      </table></div>
      <p class="texto-suave">{{ filtradas().length }} membresías · saldo total pendiente {{ saldoTotal() | currency: 'USD' }}</p>
    }

    @if (creando()) {
      <app-membresia-form (cerrar)="creando.set(false)" (guardado)="creando.set(false); cargar()" />
    }
    @if (editando(); as m) {
      <app-membresia-form [membresia]="m" (cerrar)="editando.set(null)" (guardado)="editando.set(null); cargar()" />
    }
    @if (pagando(); as m) {
      <app-pago-form [membresias]="[m]" [membresiaId]="m.id" (cerrar)="pagando.set(null)" (guardado)="pagando.set(null); cargar()" />
    }
  `,
})
export class Membresias implements OnInit {
  private api = inject(MembresiaService);
  private notif = inject(NotificacionService);
  protected esAdmin = inject(AuthService).tieneRol('ADMIN');

  protected lista = signal<Membresia[]>([]);
  protected cargando = signal(true);
  protected error = signal<string | null>(null);
  protected creando = signal(false);
  protected editando = signal<Membresia | null>(null);
  protected pagando = signal<Membresia | null>(null);

  private textoS = signal('');
  private estadoS = signal<EstadoMembresia | ''>('');
  private saldoS = signal(false);
  get texto() { return this.textoS(); }
  set texto(v: string) { this.textoS.set(v); }
  get estado() { return this.estadoS(); }
  set estado(v: EstadoMembresia | '') { this.estadoS.set(v); }
  get conSaldo() { return this.saldoS(); }
  set conSaldo(v: boolean) { this.saldoS.set(v); }

  protected filtradas = computed(() => {
    const t = normalizar(this.textoS());
    return this.lista().filter(
      (m) =>
        (!this.estadoS() || m.estado === this.estadoS()) &&
        (!this.saldoS() || m.saldoPendiente > 0) &&
        (!t || normalizar(`${m.socioNombre} ${m.socioCedula}`).includes(t)),
    );
  });
  protected saldoTotal = computed(() =>
    this.filtradas().filter((m) => m.estado !== 'CANCELADA').reduce((s, m) => s + Number(m.saldoPendiente), 0),
  );

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

  nueva(): void {
    this.creando.set(true);
  }

  async cancelar(m: Membresia): Promise<void> {
    const ok = await this.notif.confirmar('Cancelar membresía', `¿Cancelar la membresía #${m.id} de ${m.socioNombre}? Ya no se podrán registrar pagos en ella.`, 'Cancelar membresía');
    if (!ok) return;
    this.api.cancelar(m.id).subscribe({
      next: () => {
        this.notif.exito('Membresía cancelada');
        this.cargar();
      },
      error: (e) => this.notif.error(mensajeError(e)),
    });
  }

  async eliminar(m: Membresia): Promise<void> {
    const ok = await this.notif.confirmar('Eliminar membresía', `¿Eliminar la membresía #${m.id} de ${m.socioNombre}? Solo es posible si no tiene pagos.`);
    if (!ok) return;
    this.api.eliminar(m.id).subscribe({
      next: () => {
        this.notif.exito('Membresía eliminada');
        this.cargar();
      },
      error: (e) => this.notif.error(mensajeError(e)),
    });
  }
}
