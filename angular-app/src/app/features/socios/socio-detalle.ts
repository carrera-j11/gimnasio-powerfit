import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Inscripcion, Membresia, Pago, Socio } from '../../core/models';
import { InscripcionService, MembresiaService, PagoService, SocioService } from '../../core/services/api.services';
import { NotificacionService } from '../../core/services/notificacion.service';
import { Badge, Estado, EtiquetaPipe } from '../../shared/ui';
import { mensajeError } from '../../shared/utils';
import { InscripcionForm } from '../inscripciones/inscripcion-form';
import { MembresiaForm } from '../membresias/membresia-form';
import { PagoForm } from '../pagos/pago-form';
import { SocioEditForm } from './socio-edit-form';
import { A11Y } from '../../shared/a11y';

type Pestana = 'membresias' | 'pagos' | 'clases';

/** Ficha del socio: datos, membresías, pagos e inscripciones, con acciones rápidas. */
@Component({
  selector: 'app-socio-detalle',
  imports: [...A11Y, RouterLink, CurrencyPipe, DatePipe, Badge, Estado, EtiquetaPipe, MembresiaForm, PagoForm, InscripcionForm, SocioEditForm],
  template: `
    <a routerLink="/socios" class="volver">← Socios</a>
    <app-estado [cargando]="cargando()" [error]="error()" />

    @if (socio(); as s) {
      <div class="cabecera">
        <div><p class="sobre">Ficha del socio · {{ s.cedula }}</p><h1>{{ s.nombres }} {{ s.apellidos }}</h1></div>
        <div class="acciones-izq">
          <button type="button" class="btn" (click)="editando.set(true)">Editar datos</button>
          <button type="button" class="btn" (click)="modal.set('membresia')">Nueva membresía</button>
          <button type="button" class="btn" (click)="modal.set('pago')" [disabled]="!conSaldo().length">Registrar pago</button>
          <button type="button" class="btn btn-primario" (click)="modal.set('inscripcion')" [disabled]="!s.membresiaVigente">Inscribir en clase</button>
        </div>
      </div>

      <dl class="datos datos-fila bloque">
        <div><dt>Email</dt><dd>{{ s.email }}</dd></div>
        <div><dt>Celular</dt><dd>{{ s.celular }}</dd></div>
        <div><dt>Edad</dt><dd>{{ s.edad }} años</dd></div>
        <div><dt>Afiliación</dt><dd>{{ s.fechaAfiliacion }}</dd></div>
        <div><dt>Objetivo</dt><dd>{{ s.objetivo || '—' }}</dd></div>
        <div><dt>Cuenta</dt><dd><app-badge [valor]="s.estadoCuenta" /></dd></div>
        <div><dt>Membresía</dt><dd>@if (s.membresiaVigente) { <span class="badge b-ACTIVA">Vigente</span> } @else { <span class="badge b-VENCIDA">Sin membresía</span> }</dd></div>
      </dl>

      <div class="pestanas" role="tablist">
        <button type="button" role="tab" [class.activa]="pestana() === 'membresias'" [attr.aria-selected]="pestana() === 'membresias'" (click)="pestana.set('membresias')">Membresías ({{ membresias().length }})</button>
        <button type="button" role="tab" [class.activa]="pestana() === 'pagos'" [attr.aria-selected]="pestana() === 'pagos'" (click)="pestana.set('pagos')">Pagos ({{ pagos().length }})</button>
        <button type="button" role="tab" [class.activa]="pestana() === 'clases'" [attr.aria-selected]="pestana() === 'clases'" (click)="pestana.set('clases')">Clases ({{ inscripciones().length }})</button>
      </div>

      @switch (pestana()) {
        @case ('membresias') {
          <app-estado [vacio]="!membresias().length" textoVacio="El socio no tiene membresías." />
          @if (membresias().length) {
            <div class="tabla-cont"><table class="tabla">
              <thead><tr><th>#</th><th>Plan</th><th>Inicio</th><th>Fin</th><th>Estado</th><th class="num">Precio</th><th class="num">Pagado</th><th class="num">Saldo</th><th></th></tr></thead>
              <tbody>
                @for (m of membresias(); track m.id) {
                  <tr>
                    <td class="num">{{ m.id }}</td><td>{{ m.planNombre }}</td><td>{{ m.fechaInicio }}</td><td>{{ m.fechaFin }}</td>
                    <td><app-badge [valor]="m.estado" /></td>
                    <td class="num">{{ m.precioPlan | currency: 'USD' }}</td>
                    <td class="num">{{ m.totalPagado | currency: 'USD' }}</td>
                    <td class="num" [class.texto-peligro]="m.saldoPendiente > 0">{{ m.saldoPendiente | currency: 'USD' }}</td>
                    <td class="acciones-fila">
                      @if (m.estado !== 'CANCELADA' && m.saldoPendiente > 0) {
                        <button type="button" class="btn btn-sm" (click)="pagarMembresia.set(m.id); modal.set('pago')">Pagar</button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table></div>
          }
        }
        @case ('pagos') {
          <app-estado [vacio]="!pagos().length" textoVacio="El socio no tiene pagos." />
          @if (pagos().length) {
            <div class="tabla-cont"><table class="tabla">
              <thead><tr><th>#</th><th>Fecha</th><th>Membresía</th><th>Método</th><th>Referencia</th><th class="num">Monto</th></tr></thead>
              <tbody>
                @for (p of pagos(); track p.id) {
                  <tr>
                    <td class="num">{{ p.id }}</td><td>{{ p.fechaPago | date: 'dd/MM/yyyy HH:mm' }}</td>
                    <td>#{{ p.membresiaId }} · {{ p.planNombre }}</td><td>{{ p.metodoPago | etiqueta }}</td>
                    <td>{{ p.referencia || '—' }}</td><td class="num">{{ p.monto | currency: 'USD' }}</td>
                  </tr>
                }
              </tbody>
            </table></div>
          }
        }
        @case ('clases') {
          <app-estado [vacio]="!inscripciones().length" textoVacio="El socio no está inscrito en clases." />
          @if (inscripciones().length) {
            <div class="tabla-cont"><table class="tabla">
              <thead><tr><th>Clase</th><th>Horario</th><th>Entrenador</th><th>Inscrito el</th><th></th></tr></thead>
              <tbody>
                @for (i of inscripciones(); track i.id) {
                  <tr>
                    <td>{{ i.claseNombre }}</td><td>{{ i.horario }}</td><td>{{ i.entrenadorNombre }}</td>
                    <td>{{ i.fechaInscripcion | date: 'dd/MM/yyyy' }}</td>
                    <td class="acciones-fila"><button type="button" class="btn btn-sm btn-peligro-txt" (click)="cancelarInscripcion(i)">Cancelar</button></td>
                  </tr>
                }
              </tbody>
            </table></div>
          }
        }
      }

      @if (editando()) {
        <app-socio-edit-form [socio]="s" (cerrar)="editando.set(false)" (guardado)="editando.set(false); cargar()" />
      }
      @switch (modal()) {
        @case ('membresia') {
          <app-membresia-form [socioId]="s.id" (cerrar)="modal.set(null)" (guardado)="cerrarYRecargar()" />
        }
        @case ('pago') {
          <app-pago-form [membresias]="membresias()" [membresiaId]="pagarMembresia() ?? conSaldo()[0]?.id ?? null"
            (cerrar)="cerrarModal()" (guardado)="cerrarYRecargar()" />
        }
        @case ('inscripcion') {
          <app-inscripcion-form [socioId]="s.id" (cerrar)="modal.set(null)" (guardado)="cerrarYRecargar()" />
        }
      }
    }
  `,
})
export class SocioDetalle implements OnInit {
  /** :id de la ruta (withComponentInputBinding) */
  id = input.required<string>();

  private sociosApi = inject(SocioService);
  private membresiasApi = inject(MembresiaService);
  private pagosApi = inject(PagoService);
  private inscripcionesApi = inject(InscripcionService);
  private notif = inject(NotificacionService);

  protected socio = signal<Socio | null>(null);
  protected membresias = signal<Membresia[]>([]);
  protected pagos = signal<Pago[]>([]);
  protected inscripciones = signal<Inscripcion[]>([]);
  protected conSaldo = computed(() => this.membresias().filter((m) => m.estado !== 'CANCELADA' && m.saldoPendiente > 0));
  protected cargando = signal(true);
  protected error = signal<string | null>(null);
  protected pestana = signal<Pestana>('membresias');
  protected modal = signal<'membresia' | 'pago' | 'inscripcion' | null>(null);
  protected pagarMembresia = signal<number | null>(null);
  protected editando = signal(false);

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    const id = Number(this.id());
    forkJoin({
      socio: this.sociosApi.buscar(id),
      membresias: this.membresiasApi.porSocio(id),
      pagos: this.pagosApi.listar(),
      inscripciones: this.inscripcionesApi.listar(),
    }).subscribe({
      next: (r) => {
        this.socio.set(r.socio);
        this.membresias.set(r.membresias.sort((a, b) => b.id - a.id));
        this.pagos.set(r.pagos.filter((p) => p.socioId === id).sort((a, b) => b.id - a.id));
        this.inscripciones.set(r.inscripciones.filter((i) => i.socioId === id));
        this.error.set(null);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(mensajeError(e));
        this.cargando.set(false);
      },
    });
  }

  cerrarModal(): void {
    this.modal.set(null);
    this.pagarMembresia.set(null);
  }

  cerrarYRecargar(): void {
    this.cerrarModal();
    this.cargar();
  }

  async cancelarInscripcion(i: Inscripcion): Promise<void> {
    const ok = await this.notif.confirmar('Cancelar inscripción', `¿Quitar al socio de la clase ${i.claseNombre} (${i.horario})?`, 'Cancelar inscripción');
    if (!ok) return;
    this.inscripcionesApi.eliminar(i.id).subscribe({
      next: () => {
        this.notif.exito('Inscripción cancelada');
        this.cargar();
      },
      error: (e) => this.notif.error(mensajeError(e)),
    });
  }
}
