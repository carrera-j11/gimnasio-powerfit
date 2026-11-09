import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Socio } from '../../core/models';
import { SocioService } from '../../core/services/api.services';
import { AuthService } from '../../core/services/auth.service';
import { NotificacionService } from '../../core/services/notificacion.service';
import { Badge, Estado } from '../../shared/ui';
import { mensajeError, normalizar } from '../../shared/utils';
import { SocioEditForm } from './socio-edit-form';
import { A11Y } from '../../shared/a11y';

/** Lista de socios con buscador; la búsqueda exacta por cédula usa GET /socios/cedula/{cedula}. */
@Component({
  selector: 'app-socios',
  imports: [...A11Y, FormsModule, RouterLink, Badge, Estado, SocioEditForm],
  template: `
    <div class="cabecera">
      <div><p class="sobre">Recepción</p><h1>Socios</h1></div>
    </div>

    <div class="filtros">
      <label class="campo campo-linea campo-crece"><span>Buscar</span>
        <input id="socios-buscar" [(ngModel)]="texto" placeholder="Nombre, apellido o email" />
      </label>
      <form class="buscar-cedula" (ngSubmit)="buscarCedula()">
        <label class="campo campo-linea"><span>Cédula</span>
          <input id="socios-cedula" name="cedula" [(ngModel)]="cedula" maxlength="10" inputmode="numeric" placeholder="0102030405" />
        </label>
        <button type="submit" class="btn">Buscar por cédula</button>
      </form>
      <label class="check"><input id="socios-vigente" type="checkbox" [(ngModel)]="soloVigentes" /> Solo con membresía vigente</label>
    </div>

    <app-estado [cargando]="cargando()" [error]="error()" [vacio]="!cargando() && !filtrados().length" textoVacio="No hay socios que coincidan." />

    @if (filtrados().length) {
      <div class="tabla-cont"><table class="tabla">
        <thead><tr><th>Socio</th><th>Cédula</th><th>Email</th><th>Celular</th><th class="num">Edad</th><th>Cuenta</th><th>Membresía</th><th></th></tr></thead>
        <tbody>
          @for (s of filtrados(); track s.id) {
            <tr>
              <td><a [routerLink]="['/socios', s.id]" class="enlace-fuerte">{{ s.apellidos }} {{ s.nombres }}</a></td>
              <td>{{ s.cedula }}</td>
              <td>{{ s.email }}</td>
              <td>{{ s.celular }}</td>
              <td class="num">{{ s.edad }}</td>
              <td><app-badge [valor]="s.estadoCuenta" /></td>
              <td>@if (s.membresiaVigente) { <span class="badge b-ACTIVA">Vigente</span> } @else { <span class="badge b-VENCIDA">Sin membresía</span> }</td>
              <td class="acciones-fila">
                <a [routerLink]="['/socios', s.id]" class="btn btn-sm">Ficha</a>
                <button type="button" class="btn btn-sm" (click)="editando.set(s)">Editar</button>
                @if (esAdmin) {
                  <button type="button" class="btn btn-sm btn-peligro-txt" (click)="eliminar(s)">Eliminar</button>
                }
              </td>
            </tr>
          }
        </tbody>
      </table></div>
      <p class="texto-suave">{{ filtrados().length }} de {{ socios().length }} socios</p>
    }

    @if (editando(); as s) {
      <app-socio-edit-form [socio]="s" (cerrar)="editando.set(null)" (guardado)="editando.set(null); cargar()" />
    }
  `,
})
export class Socios implements OnInit {
  private api = inject(SocioService);
  private notif = inject(NotificacionService);
  protected esAdmin = inject(AuthService).tieneRol('ADMIN');

  protected socios = signal<Socio[]>([]);
  protected cargando = signal(true);
  protected error = signal<string | null>(null);
  protected editando = signal<Socio | null>(null);

  // Filtros como signals para que la lista se recalcule sola
  private textoS = signal('');
  private vigentesS = signal(false);
  get texto() { return this.textoS(); }
  set texto(v: string) { this.textoS.set(v); }
  get soloVigentes() { return this.vigentesS(); }
  set soloVigentes(v: boolean) { this.vigentesS.set(v); }
  protected cedula = '';

  protected filtrados = computed(() => {
    const t = normalizar(this.textoS());
    return this.socios().filter(
      (s) =>
        (!this.vigentesS() || s.membresiaVigente) &&
        (!t || normalizar(`${s.nombres} ${s.apellidos} ${s.email} ${s.cedula}`).includes(t)),
    );
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.api.listar().subscribe({
      next: (l) => {
        this.socios.set(l.sort((a, b) => a.apellidos.localeCompare(b.apellidos)));
        this.error.set(null);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(mensajeError(e));
        this.cargando.set(false);
      },
    });
  }

  buscarCedula(): void {
    const c = this.cedula.trim();
    if (!c) {
      this.cargar();
      return;
    }
    this.cargando.set(true);
    this.api.buscarPorCedula(c).subscribe({
      next: (s) => {
        this.socios.set([s]);
        this.texto = '';
        this.error.set(null);
        this.cargando.set(false);
      },
      error: (e) => {
        this.socios.set([]);
        this.error.set(mensajeError(e));
        this.cargando.set(false);
      },
    });
  }

  async eliminar(s: Socio): Promise<void> {
    const ok = await this.notif.confirmar('Eliminar socio', `¿Eliminar a ${s.nombres} ${s.apellidos}? Solo es posible si no tiene membresías ni inscripciones.`);
    if (!ok) return;
    this.api.eliminar(s.id).subscribe({
      next: () => {
        this.notif.exito('Socio eliminado');
        this.cargar();
      },
      error: (e) => this.notif.error(mensajeError(e)),
    });
  }
}
