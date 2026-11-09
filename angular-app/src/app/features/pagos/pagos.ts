import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { METODOS_PAGO, MetodoPago, Pago } from '../../core/models';
import { PagoService } from '../../core/services/api.services';
import { AuthService } from '../../core/services/auth.service';
import { NotificacionService } from '../../core/services/notificacion.service';
import { Estado, EtiquetaPipe } from '../../shared/ui';
import { mensajeError, normalizar } from '../../shared/utils';
import { PagoForm } from './pago-form';
import { A11Y } from '../../shared/a11y';

/** Pagos: registrar, corregir y eliminar (solo ADMIN). */
@Component({
  selector: 'app-pagos',
  imports: [...A11Y, FormsModule, RouterLink, CurrencyPipe, DatePipe, EtiquetaPipe, Estado, PagoForm],
  template: `
    <div class="cabecera">
      <div><p class="sobre">Recepción</p><h1>Pagos</h1></div>
      <button type="button" class="btn btn-primario" (click)="creando.set(true)">Registrar pago</button>
    </div>

    <div class="filtros">
      <label class="campo campo-linea campo-crece"><span>Buscar</span>
        <input id="pagos-buscar" [(ngModel)]="texto" placeholder="Socio, plan o referencia" />
      </label>
      <label class="campo campo-linea"><span>Método</span>
        <select id="pagos-metodo" [(ngModel)]="metodo">
          <option value="">Todos</option>
          @for (m of metodos; track m) { <option [value]="m">{{ m | etiqueta }}</option> }
        </select>
      </label>
    </div>

    <app-estado [cargando]="cargando()" [error]="error()" [vacio]="!cargando() && !filtrados().length" />

    @if (filtrados().length) {
      <div class="tabla-cont"><table class="tabla">
        <thead><tr><th>#</th><th>Fecha</th><th>Socio</th><th>Membresía</th><th>Método</th><th>Referencia</th><th class="num">Monto</th><th></th></tr></thead>
        <tbody>
          @for (p of filtrados(); track p.id) {
            <tr>
              <td class="num">{{ p.id }}</td>
              <td>{{ p.fechaPago | date: 'dd/MM/yyyy HH:mm' }}</td>
              <td><a [routerLink]="['/socios', p.socioId]" class="enlace-fuerte">{{ p.socioNombre }}</a></td>
              <td>#{{ p.membresiaId }} · {{ p.planNombre }}</td>
              <td>{{ p.metodoPago | etiqueta }}</td>
              <td>{{ p.referencia || '—' }}</td>
              <td class="num">{{ p.monto | currency: 'USD' }}</td>
              <td class="acciones-fila">
                <button type="button" class="btn btn-sm" (click)="editando.set(p)">Corregir</button>
                @if (esAdmin) { <button type="button" class="btn btn-sm btn-peligro-txt" (click)="eliminar(p)">Eliminar</button> }
              </td>
            </tr>
          }
        </tbody>
      </table></div>
      <p class="texto-suave">{{ filtrados().length }} pagos · total {{ total() | currency: 'USD' }}</p>
    }

    @if (creando()) {
      <app-pago-form (cerrar)="creando.set(false)" (guardado)="creando.set(false); cargar()" />
    }
    @if (editando(); as p) {
      <app-pago-form [pago]="p" (cerrar)="editando.set(null)" (guardado)="editando.set(null); cargar()" />
    }
  `,
})
export class Pagos implements OnInit {
  private api = inject(PagoService);
  private notif = inject(NotificacionService);
  protected esAdmin = inject(AuthService).tieneRol('ADMIN');
  protected metodos = METODOS_PAGO;

  protected lista = signal<Pago[]>([]);
  protected cargando = signal(true);
  protected error = signal<string | null>(null);
  protected creando = signal(false);
  protected editando = signal<Pago | null>(null);

  private textoS = signal('');
  private metodoS = signal<MetodoPago | ''>('');
  get texto() { return this.textoS(); }
  set texto(v: string) { this.textoS.set(v); }
  get metodo() { return this.metodoS(); }
  set metodo(v: MetodoPago | '') { this.metodoS.set(v); }

  protected filtrados = computed(() => {
    const t = normalizar(this.textoS());
    return this.lista().filter(
      (p) =>
        (!this.metodoS() || p.metodoPago === this.metodoS()) &&
        (!t || normalizar(`${p.socioNombre} ${p.planNombre} ${p.referencia ?? ''}`).includes(t)),
    );
  });
  protected total = computed(() => this.filtrados().reduce((s, p) => s + Number(p.monto), 0));

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

  async eliminar(p: Pago): Promise<void> {
    const ok = await this.notif.confirmar('Eliminar pago', `¿Eliminar el pago #${p.id} de ${p.socioNombre} por $${p.monto}?`);
    if (!ok) return;
    this.api.eliminar(p.id).subscribe({
      next: () => {
        this.notif.exito('Pago eliminado');
        this.cargar();
      },
      error: (e) => this.notif.error(mensajeError(e)),
    });
  }
}
