import { CurrencyPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, Observable, of } from 'rxjs';
import { Clase, Inscripcion, Membresia, Usuario } from '../../core/models';
import {
  ClaseService, InscripcionService, MembresiaService, SocioService, UsuarioAdminService,
} from '../../core/services/api.services';
import { AuthService } from '../../core/services/auth.service';
import { Badge, EtiquetaPipe, HoraPipe } from '../../shared/ui';
import { A11Y } from '../../shared/a11y';

interface Tarjeta {
  etiqueta: string;
  valor: string | number;
  ruta: string;
  alerta?: boolean;
}

const DIA_HOY = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'][new Date().getDay()];

/** Resumen distinto según el rol que inició sesión. */
@Component({
  selector: 'app-panel',
  imports: [...A11Y, RouterLink, CurrencyPipe, Badge, EtiquetaPipe, HoraPipe],
  template: `
    <div class="cabecera">
      <div>
        <p class="sobre">{{ auth.rol() | etiqueta }}</p>
        <h1>Hola, {{ auth.usuario()?.nombres }}</h1>
      </div>
    </div>

    @if (cargando()) {
      <div class="estado"><span class="spinner"></span> Cargando resumen…</div>
    } @else {
      <div class="tarjetas">
        @for (t of tarjetas(); track t.etiqueta) {
          <a class="tarjeta" [class.tarjeta-alerta]="t.alerta" [routerLink]="t.ruta">
            <span class="tarjeta-valor">{{ t.valor }}</span>
            <span class="tarjeta-etq">{{ t.etiqueta }}</span>
          </a>
        }
      </div>

      @if (pendientes().length) {
        <section class="bloque">
          <div class="bloque-cab">
            <h2>Solicitudes por revisar</h2>
            <a routerLink="/admin/solicitudes" class="btn btn-sm">Revisar todas</a>
          </div>
          <div class="tabla-cont"><table class="tabla">
            <thead><tr><th>Nombre</th><th>Rol</th><th>Estado</th><th>Email</th></tr></thead>
            <tbody>
              @for (u of pendientes().slice(0, 5); track u.id) {
                <tr><td>{{ u.nombres }} {{ u.apellidos }}</td><td>{{ u.rol | etiqueta }}</td><td><app-badge [valor]="u.estado" /></td><td>{{ u.email }}</td></tr>
              }
            </tbody>
          </table></div>
        </section>
      }

      @if (membresia(); as m) {
        <section class="bloque">
          <div class="bloque-cab"><h2>Mi membresía</h2><a routerLink="/mi-membresia" class="btn btn-sm">Ver detalle</a></div>
          <div class="ficha-membresia">
            <div><span class="etq">Plan</span><strong>{{ m.planNombre }}</strong></div>
            <div><span class="etq">Vigencia</span><strong>{{ m.fechaInicio }} → {{ m.fechaFin }}</strong></div>
            <div><span class="etq">Estado</span><app-badge [valor]="m.estado" /></div>
            <div><span class="etq">Saldo pendiente</span><strong [class.texto-peligro]="m.saldoPendiente > 0">{{ m.saldoPendiente | currency: 'USD' }}</strong></div>
          </div>
        </section>
      }

      @if (clasesHoy().length) {
        <section class="bloque">
          <div class="bloque-cab"><h2>Clases de hoy ({{ hoy | etiqueta }})</h2><a [routerLink]="rutaClases()" class="btn btn-sm">Ver horario</a></div>
          <div class="tabla-cont"><table class="tabla">
            <thead><tr><th>Clase</th><th>Hora</th><th>Entrenador</th><th class="num">Inscritos</th></tr></thead>
            <tbody>
              @for (c of clasesHoy(); track c.id) {
                <tr><td>{{ c.nombre }}</td><td>{{ c.horaInicio | hora }} – {{ c.horaFin | hora }}</td><td>{{ c.entrenadorNombre }}</td><td class="num">{{ c.inscritos }}/{{ c.cupoMaximo }}</td></tr>
              }
            </tbody>
          </table></div>
        </section>
      }

      @if (misInscripciones().length) {
        <section class="bloque">
          <div class="bloque-cab"><h2>Mis clases inscritas</h2><a routerLink="/mis-inscripciones" class="btn btn-sm">Gestionar</a></div>
          <ul class="lista-simple">
            @for (i of misInscripciones(); track i.id) {
              <li><strong>{{ i.claseNombre }}</strong> · {{ i.horario }} · {{ i.entrenadorNombre }}</li>
            }
          </ul>
        </section>
      }
    }
  `,
})
export class Panel implements OnInit {
  protected auth = inject(AuthService);
  private usuarios = inject(UsuarioAdminService);
  private socios = inject(SocioService);
  private membresias = inject(MembresiaService);
  private clases = inject(ClaseService);
  private inscripciones = inject(InscripcionService);

  protected hoy = DIA_HOY;
  protected cargando = signal(true);
  protected tarjetas = signal<Tarjeta[]>([]);
  protected pendientes = signal<Usuario[]>([]);
  protected membresia = signal<Membresia | null>(null);
  protected clasesHoy = signal<Clase[]>([]);
  protected misInscripciones = signal<Inscripcion[]>([]);

  protected rutaClases() {
    return this.auth.rol() === 'ENTRENADOR' ? '/mis-clases' : '/clases';
  }

  ngOnInit(): void {
    const seguro = <T>(obs: Observable<T>, defecto: T) => obs.pipe(catchError(() => of(defecto)));
    const rol = this.auth.rol();

    if (rol === 'ADMIN' || rol === 'RECEPCIONISTA') {
      forkJoin({
        pendientes: rol === 'ADMIN' ? seguro(this.usuarios.pendientes(), []) : of([] as Usuario[]),
        socios: seguro(this.socios.listar(), []),
        membresias: seguro(this.membresias.listar(), []),
        clases: seguro(this.clases.listar(), []),
      }).subscribe((r) => {
        const activas = r.membresias.filter((m) => m.estado === 'ACTIVA');
        const conSaldo = activas.filter((m) => m.saldoPendiente > 0);
        const t: Tarjeta[] = [];
        if (rol === 'ADMIN') {
          t.push({ etiqueta: 'Solicitudes pendientes', valor: r.pendientes.length, ruta: '/admin/solicitudes', alerta: r.pendientes.length > 0 });
        }
        t.push(
          { etiqueta: 'Socios registrados', valor: r.socios.length, ruta: '/socios' },
          { etiqueta: 'Membresías activas', valor: activas.length, ruta: '/membresias' },
          { etiqueta: 'Membresías con saldo', valor: conSaldo.length, ruta: '/pagos', alerta: conSaldo.length > 0 },
          { etiqueta: 'Clases semanales', valor: r.clases.length, ruta: '/clases' },
        );
        this.tarjetas.set(t);
        this.pendientes.set(r.pendientes);
        this.clasesHoy.set(this.deHoy(r.clases));
        this.cargando.set(false);
      });
    } else if (rol === 'ENTRENADOR') {
      seguro(this.clases.mias(), []).subscribe((clases) => {
        const inscritos = clases.reduce((s, c) => s + c.inscritos, 0);
        const cupos = clases.reduce((s, c) => s + c.cupoMaximo, 0);
        this.tarjetas.set([
          { etiqueta: 'Mis clases', valor: clases.length, ruta: '/mis-clases' },
          { etiqueta: 'Socios inscritos', valor: inscritos, ruta: '/mis-clases' },
          { etiqueta: 'Ocupación', valor: cupos ? Math.round((inscritos / cupos) * 100) + ' %' : '—', ruta: '/mis-clases' },
        ]);
        this.clasesHoy.set(this.deHoy(clases));
        this.cargando.set(false);
      });
    } else {
      forkJoin({
        membresias: seguro(this.membresias.mias(), []),
        inscripciones: seguro(this.inscripciones.mias(), []),
        clases: seguro(this.clases.listar(), []),
      }).subscribe((r) => {
        const actual = r.membresias.find((m) => m.estado === 'ACTIVA') ?? r.membresias[0] ?? null;
        this.membresia.set(actual);
        this.misInscripciones.set(r.inscripciones);
        this.tarjetas.set([
          { etiqueta: 'Membresía', valor: actual ? actual.planNombre : 'Sin membresía', ruta: '/mi-membresia', alerta: !actual || actual.estado !== 'ACTIVA' },
          { etiqueta: 'Clases inscritas', valor: r.inscripciones.length, ruta: '/mis-inscripciones' },
          { etiqueta: 'Clases con cupo', valor: r.clases.filter((c) => c.cuposDisponibles > 0).length, ruta: '/clases' },
        ]);
        this.clasesHoy.set(this.deHoy(r.clases));
        this.cargando.set(false);
      });
    }
  }

  private deHoy(clases: Clase[]): Clase[] {
    return clases.filter((c) => c.diaSemana === DIA_HOY).sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
  }
}
