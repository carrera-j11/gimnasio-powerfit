import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ESTADOS_CUENTA, EstadoCuenta, ROLES, Rol, Usuario } from '../../core/models';
import { UsuarioAdminService } from '../../core/services/api.services';
import { AuthService } from '../../core/services/auth.service';
import { NotificacionService } from '../../core/services/notificacion.service';
import { Badge, Estado, EtiquetaPipe, Modal } from '../../shared/ui';
import {
  aplicarErroresApi, cedula, celular, edadMinima, errorDe, mensajeError, passwordSegura, soloLetras,
} from '../../shared/utils';
import { A11Y } from '../../shared/a11y';

type Pestana = 'todos' | 'personal';

/** Cuentas del sistema: filtros por estado y rol, personal del gimnasio y creación de cuentas por el ADMIN. */
@Component({
  selector: 'app-usuarios',
  imports: [...A11Y, ReactiveFormsModule, FormsModule, DatePipe, Badge, Estado, EtiquetaPipe, Modal],
  template: `
    <div class="cabecera">
      <div><p class="sobre">Administración</p><h1>Usuarios</h1></div>
      <button type="button" class="btn btn-primario" (click)="abrirCrear()">Nuevo usuario</button>
    </div>

    <div class="pestanas" role="tablist">
      <button type="button" role="tab" [class.activa]="pestana() === 'todos'" [attr.aria-selected]="pestana() === 'todos'" (click)="cambiar('todos')">Todas las cuentas</button>
      <button type="button" role="tab" [class.activa]="pestana() === 'personal'" [attr.aria-selected]="pestana() === 'personal'" (click)="cambiar('personal')">Personal del gimnasio</button>
    </div>

    @if (pestana() === 'todos') {
      <div class="filtros">
        <label class="campo campo-linea"><span>Estado</span>
          <select id="filtro-estado" [(ngModel)]="estado" (ngModelChange)="cargar()">
            <option value="">Todos</option>
            @for (e of estados; track e) { <option [value]="e">{{ e | etiqueta }}</option> }
          </select>
        </label>
        <label class="campo campo-linea"><span>Rol</span>
          <select id="filtro-rol" [(ngModel)]="rol" (ngModelChange)="cargar()">
            <option value="">Todos</option>
            @for (r of roles; track r) { <option [value]="r">{{ r | etiqueta }}</option> }
          </select>
        </label>
      </div>
    }

    <app-estado [cargando]="cargando()" [error]="error()" [vacio]="!cargando() && !lista().length" />

    @if (lista().length) {
      <div class="tabla-cont"><table class="tabla">
        <thead><tr><th>#</th><th>Nombre</th><th>Cédula</th><th>Email</th><th>Celular</th><th>Rol</th><th>Estado</th><th>Registro</th><th></th></tr></thead>
        <tbody>
          @for (u of lista(); track u.id) {
            <tr>
              <td class="num">{{ u.id }}</td>
              <td>{{ u.nombres }} {{ u.apellidos }}</td>
              <td>{{ u.cedula }}</td>
              <td>{{ u.email }}</td>
              <td>{{ u.celular }}</td>
              <td>{{ u.rol | etiqueta }}</td>
              <td><app-badge [valor]="u.estado" /></td>
              <td>{{ u.fechaRegistro | date: 'dd/MM/yyyy' }}</td>
              <td class="acciones-fila">
                <button type="button" class="btn btn-sm" (click)="verDetalle(u.id)">Ver</button>
                @if (u.estado !== 'APROBADA' && (u.rol !== 'ADMIN' || soyPrincipal())) {
                  <button type="button" class="btn btn-sm btn-peligro-txt" (click)="eliminar(u)">Eliminar</button>
                }
              </td>
            </tr>
          }
        </tbody>
      </table></div>
    }

    @if (detalle(); as u) {
      <app-modal [titulo]="u.nombres + ' ' + u.apellidos" (cerrar)="detalle.set(null)">
        <dl class="datos">
          <div><dt>Id</dt><dd>{{ u.id }}</dd></div>
          <div><dt>Cédula</dt><dd>{{ u.cedula }}</dd></div>
          <div><dt>Email</dt><dd>{{ u.email }}</dd></div>
          <div><dt>Celular</dt><dd>{{ u.celular }}</dd></div>
          <div><dt>Nacimiento</dt><dd>{{ u.fechaNacimiento }} ({{ u.edad }} años)</dd></div>
          <div><dt>Rol</dt><dd>{{ u.rol | etiqueta }}</dd></div>
          <div><dt>Estado</dt><dd><app-badge [valor]="u.estado" /></dd></div>
          @if (u.motivoRechazo) { <div><dt>Motivo de rechazo</dt><dd>{{ u.motivoRechazo }}</dd></div> }
          <div><dt>Registro</dt><dd>{{ u.fechaRegistro | date: 'dd/MM/yyyy HH:mm' }}</dd></div>
          @if (u.fechaAprobacion) { <div><dt>Revisión</dt><dd>{{ u.fechaAprobacion | date: 'dd/MM/yyyy HH:mm' }}</dd></div> }
        </dl>
      </app-modal>
    }

    @if (creando()) {
      <app-modal titulo="Nuevo usuario" [ancho]="true" (cerrar)="creando.set(false)">
        <p class="texto-suave">La cuenta queda pendiente: la persona verifica su correo con el código que le llega y luego usted la aprueba en Solicitudes.</p>
        <form [formGroup]="form" (ngSubmit)="crear()" novalidate>
          <div class="rejilla-2">
            <label class="campo"><span>Rol</span>
              <select id="nu-rol" formControlName="rol">
                <option value="SOCIO">Socio</option>
                <option value="ENTRENADOR">Entrenador</option>
                <option value="RECEPCIONISTA">Recepcionista (máx. 5)</option>
                <option value="ADMIN">Administrador (máx. 3)</option>
              </select>
              @if (rolNuevo() === 'ADMIN') { <small class="ayuda">Solo el administrador principal puede aprobarlo.</small> }</label>
            <label class="campo"><span>Cédula</span><input id="nu-cedula" formControlName="cedula" maxlength="10" />
              @if (err('cedula'); as e) { <small class="err">{{ e }}</small> }</label>
            <label class="campo"><span>Nombres</span><input id="nu-nombres" formControlName="nombres" />
              @if (err('nombres'); as e) { <small class="err">{{ e }}</small> }</label>
            <label class="campo"><span>Apellidos</span><input id="nu-apellidos" formControlName="apellidos" />
              @if (err('apellidos'); as e) { <small class="err">{{ e }}</small> }</label>
            <label class="campo"><span>Email</span><input id="nu-email" type="email" formControlName="email" />
              @if (err('email'); as e) { <small class="err">{{ e }}</small> }</label>
            <label class="campo"><span>Celular</span><input id="nu-celular" formControlName="celular" maxlength="10" placeholder="09XXXXXXXX" />
              @if (err('celular'); as e) { <small class="err">{{ e }}</small> }</label>
            <label class="campo"><span>Fecha de nacimiento</span><input id="nu-fecha" type="date" formControlName="fechaNacimiento" />
              @if (err('fechaNacimiento'); as e) { <small class="err">{{ e }}</small> }</label>
            <label class="campo"><span>Contraseña inicial</span><input id="nu-password" type="password" formControlName="password" autocomplete="new-password" />
              @if (err('password'); as e) { <small class="err">{{ e }}</small> }</label>
            @if (rolNuevo() === 'ENTRENADOR') {
              <label class="campo"><span>Especialidad</span><input id="nu-especialidad" formControlName="especialidad" />
                @if (err('especialidad'); as e) { <small class="err">{{ e }}</small> }</label>
            }
            @if (rolNuevo() === 'SOCIO') {
              <label class="campo"><span>Objetivo (opcional)</span><input id="nu-objetivo" formControlName="objetivo" /></label>
            }
          </div>
          @if (errorModal()) { <div class="alerta alerta-error" role="alert">{{ errorModal() }}</div> }
          <div class="acciones">
            <button type="button" class="btn" (click)="creando.set(false)">Volver</button>
            <button type="submit" class="btn btn-primario" [disabled]="guardando()">{{ guardando() ? 'Creando…' : 'Crear usuario' }}</button>
          </div>
        </form>
      </app-modal>
    }
  `,
})
export class Usuarios implements OnInit {
  private api = inject(UsuarioAdminService);
  private notif = inject(NotificacionService);
  private auth = inject(AuthService);
  protected soyPrincipal = computed(() => this.auth.usuario()?.adminPrincipal === true);

  protected estados = ESTADOS_CUENTA;
  protected roles = ROLES;
  protected estado: EstadoCuenta | '' = '';
  protected rol: Rol | '' = '';

  protected pestana = signal<Pestana>('todos');
  protected lista = signal<Usuario[]>([]);
  protected cargando = signal(true);
  protected error = signal<string | null>(null);
  protected detalle = signal<Usuario | null>(null);
  protected creando = signal(false);
  protected guardando = signal(false);
  protected errorModal = signal<string | null>(null);
  protected rolNuevo = signal<Rol>('SOCIO');

  protected form = inject(FormBuilder).nonNullable.group({
    rol: ['SOCIO' as Rol],
    cedula: ['', [Validators.required, cedula]],
    nombres: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50), soloLetras]],
    apellidos: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50), soloLetras]],
    email: ['', [Validators.required, Validators.email]],
    celular: ['', [Validators.required, celular]],
    fechaNacimiento: ['', [Validators.required, edadMinima(() => (this.rolNuevo() === 'SOCIO' ? 15 : 18))]],
    password: ['', [Validators.required, passwordSegura]],
    especialidad: [''],
    objetivo: ['', Validators.maxLength(150)],
  });

  constructor() {
    this.form.controls.rol.valueChanges.subscribe((r) => {
      this.rolNuevo.set(r);
      this.form.controls.especialidad.setValidators(r === 'ENTRENADOR' ? [Validators.required, Validators.minLength(3), Validators.maxLength(60)] : []);
      this.form.controls.especialidad.updateValueAndValidity();
      this.form.controls.fechaNacimiento.updateValueAndValidity();
    });
  }

  protected err(c: string) {
    return errorDe(this.form.get(c));
  }

  ngOnInit(): void {
    this.cargar();
  }

  cambiar(p: Pestana): void {
    this.pestana.set(p);
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    const obs = this.pestana() === 'personal' ? this.api.personal() : this.api.listar(this.estado, this.rol);
    obs.subscribe({
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

  verDetalle(id: number): void {
    this.api.buscar(id).subscribe({
      next: (u) => this.detalle.set(u),
      error: (e) => this.notif.error(mensajeError(e)),
    });
  }

  abrirCrear(): void {
    this.form.reset();
    this.rolNuevo.set('SOCIO');
    this.errorModal.set(null);
    this.creando.set(true);
  }

  crear(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorModal.set('Revise los campos marcados.');
      return;
    }
    const v = this.form.getRawValue();
    this.guardando.set(true);
    this.errorModal.set(null);
    this.api
      .crear({
        ...v,
        especialidad: v.rol === 'ENTRENADOR' ? v.especialidad : null,
        objetivo: v.rol === 'SOCIO' && v.objetivo ? v.objetivo : null,
      })
      .subscribe({
        next: (u) => {
          this.notif.exito(`Usuario creado. Se envió el código de verificación a ${u.email}`);
          this.guardando.set(false);
          this.creando.set(false);
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
    const ok = await this.notif.confirmar('Eliminar cuenta', `¿Eliminar la cuenta de ${u.nombres} ${u.apellidos}? Solo se pueden eliminar cuentas no aprobadas.`);
    if (!ok) return;
    this.api.eliminar(u.id).subscribe({
      next: () => {
        this.notif.exito('Cuenta eliminada');
        this.cargar();
      },
      error: (e) => this.notif.error(mensajeError(e)),
    });
  }
}
