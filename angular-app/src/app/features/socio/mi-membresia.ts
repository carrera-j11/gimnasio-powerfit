import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { Membresia, Pago } from '../../core/models';
import { MembresiaService, PagoService } from '../../core/services/api.services';
import { Badge, Estado, EtiquetaPipe } from '../../shared/ui';
import { mensajeError } from '../../shared/utils';
import { MembresiaForm } from '../membresias/membresia-form';
import { PagoForm } from '../pagos/pago-form';
import { A11Y } from '../../shared/a11y';

/**
 * El socio consulta sus membresías (GET /membresias/mias) y pagos (GET /pagos/mios),
 * contrata una membresía (POST /membresias/contratar) y la paga (POST /pagos/pagar).
 */
@Component({
  selector: 'app-mi-membresia',
  imports: [...A11Y, CurrencyPipe, DatePipe, Badge, Estado, EtiquetaPipe, MembresiaForm, PagoForm],
  template: `
    <div class="cabecera">
      <div><p class="sobre">Socio</p><h1>Mi membresía</h1></div>
      @if (!cargando() && !activa()) {
        <button type="button" class="btn btn-primario" (click)="contratando.set(true)">Contratar membresía</button>
      }
    </div>
    <app-estado [cargando]="cargando()" [error]="error()" />

    @if (!cargando() && !error()) {
      @if (actual(); as m) {
        <section class="bloque membresia-actual">
          <div class="bloque-cab"><h2>{{ m.planNombre }}</h2><app-badge [valor]="m.estado" /></div>
          <div class="vigencia">
            <div><span class="etq">Desde</span><strong>{{ m.fechaInicio }}</strong></div>
            <div class="vigencia-barra" aria-hidden="true"><span [style.width.%]="avance()"></span></div>
            <div><span class="etq">Hasta</span><strong>{{ m.fechaFin }}</strong></div>
          </div>
          @if (m.estado === 'ACTIVA') { <p class="texto-suave">Te quedan {{ diasRestantes() }} días.</p> }
          <div class="resumen-saldo">
            <div><span class="etq">Precio</span><strong>{{ m.precioPlan | currency: 'USD' }}</strong></div>
            <div><span class="etq">Pagado</span><strong>{{ m.totalPagado | currency: 'USD' }}</strong></div>
            <div><span class="etq">Saldo pendiente</span><strong [class.texto-peligro]="m.saldoPendiente > 0">{{ m.saldoPendiente | currency: 'USD' }}</strong></div>
          </div>
          @if (m.estado !== 'CANCELADA' && m.saldoPendiente > 0) {
            <div class="acciones-izq">
              <button type="button" class="btn btn-primario" (click)="pagando.set(m)">Pagar {{ m.saldoPendiente | currency: 'USD' }}</button>
              <span class="texto-suave">También puedes pagar en efectivo en recepción.</span>
            </div>
          } @else if (m.estado === 'ACTIVA') {
            <p class="alerta alerta-exito">Tu membresía está pagada. Ya puedes inscribirte en las clases.</p>
          }
          @if (m.estado !== 'ACTIVA') {
            <p class="alerta">Esta membresía ya no está activa. Contrata una nueva para seguir entrenando.</p>
          }
        </section>
      } @else {
        <div class="estado">
          Aún no tienes una membresía.
          <div class="acciones-centro"><button type="button" class="btn btn-primario" (click)="contratando.set(true)">Contratar membresía</button></div>
        </div>
      }

      @if (membresias().length > 1) {
        <section class="bloque">
          <h2>Historial de membresías</h2>
          <div class="tabla-cont"><table class="tabla">
            <thead><tr><th>Plan</th><th>Inicio</th><th>Fin</th><th>Estado</th><th class="num">Saldo</th><th></th></tr></thead>
            <tbody>
              @for (m of membresias(); track m.id) {
                <tr>
                  <td>{{ m.planNombre }}</td><td>{{ m.fechaInicio }}</td><td>{{ m.fechaFin }}</td><td><app-badge [valor]="m.estado" /></td>
                  <td class="num">{{ m.saldoPendiente | currency: 'USD' }}</td>
                  <td class="acciones-fila">
                    @if (m.estado !== 'CANCELADA' && m.saldoPendiente > 0) {
                      <button type="button" class="btn btn-sm" (click)="pagando.set(m)">Pagar</button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table></div>
        </section>
      }

      <section class="bloque">
        <h2>Mis pagos</h2>
        <app-estado [vacio]="!pagos().length" textoVacio="No tienes pagos registrados." />
        @if (pagos().length) {
          <div class="tabla-cont"><table class="tabla">
            <thead><tr><th>Fecha</th><th>Plan</th><th>Método</th><th>Referencia</th><th class="num">Monto</th></tr></thead>
            <tbody>
              @for (p of pagos(); track p.id) {
                <tr><td>{{ p.fechaPago | date: 'dd/MM/yyyy HH:mm' }}</td><td>{{ p.planNombre }}</td><td>{{ p.metodoPago | etiqueta }}</td><td>{{ p.referencia || '—' }}</td><td class="num">{{ p.monto | currency: 'USD' }}</td></tr>
              }
            </tbody>
          </table></div>
        }
      </section>
    }

    @if (contratando()) {
      <app-membresia-form [paraMi]="true" (cerrar)="contratando.set(false)" (guardado)="contratando.set(false); cargar()" />
    }
    @if (pagando(); as m) {
      <app-pago-form [paraMi]="true" [membresias]="[m]" [membresiaId]="m.id" (cerrar)="pagando.set(null)" (guardado)="pagando.set(null); cargar()" />
    }
  `,
})
export class MiMembresia implements OnInit {
  private membresiasApi = inject(MembresiaService);
  private pagosApi = inject(PagoService);

  protected membresias = signal<Membresia[]>([]);
  protected pagos = signal<Pago[]>([]);
  protected cargando = signal(true);
  protected error = signal<string | null>(null);
  protected contratando = signal(false);
  protected pagando = signal<Membresia | null>(null);

  protected activa = computed(() => this.membresias().find((m) => m.estado === 'ACTIVA') ?? null);
  protected actual = computed(() => this.activa() ?? this.membresias()[0] ?? null);
  protected diasRestantes = computed(() => {
    const m = this.actual();
    if (!m) return 0;
    return Math.max(0, Math.ceil((new Date(m.fechaFin + 'T23:59:59').getTime() - Date.now()) / 86400000));
  });
  protected avance = computed(() => {
    const m = this.actual();
    if (!m) return 0;
    const ini = new Date(m.fechaInicio + 'T00:00:00').getTime();
    const fin = new Date(m.fechaFin + 'T23:59:59').getTime();
    return Math.min(100, Math.max(0, ((Date.now() - ini) / (fin - ini)) * 100));
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    forkJoin({ membresias: this.membresiasApi.mias(), pagos: this.pagosApi.mios() }).subscribe({
      next: (r) => {
        this.membresias.set(r.membresias.sort((a, b) => b.id - a.id));
        this.pagos.set(r.pagos.sort((a, b) => b.id - a.id));
        this.error.set(null);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(mensajeError(e));
        this.cargando.set(false);
      },
    });
  }
}
