import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Entrenador, Socio, Usuario } from '../../core/models';
import { EntrenadorService, SocioService } from '../../core/services/api.services';
import { AuthService } from '../../core/services/auth.service';
import { NotificacionService } from '../../core/services/notificacion.service';
import { Badge, Estado, EtiquetaPipe } from '../../shared/ui';
import { aplicarErroresApi, celular, errorDe, mensajeError, soloLetras } from '../../shared/utils';
import { A11Y } from '../../shared/a11y';

/** Datos del usuario (GET /auth/perfil). Socio y entrenador pueden editar los suyos. */
@Component({
  selector: 'app-perfil',
  imports: [...A11Y, ReactiveFormsModule, DatePipe, Badge, Estado, EtiquetaPipe],
  template: `
    <div class="cabecera"><div><p class="sobre">Cuenta</p><h1>Mi perfil</h1></div></div>
    <app-estado [cargando]="cargando()" [error]="error()" />

    @if (usuario(); as u) {
      <div class="dos-col">
        <section class="bloque">
          <h2>Datos de la cuenta</h2>
          <dl class="datos">
            <div><dt>Cédula</dt><dd>{{ u.cedula }}</dd></div>
            <div><dt>Nombre</dt><dd>{{ u.nombres }} {{ u.apellidos }}</dd></div>
            <div><dt>Email</dt><dd>{{ u.email }}</dd></div>
            <div><dt>Celular</dt><dd>{{ u.celular }}</dd></div>
            <div><dt>Fecha de nacimiento</dt><dd>{{ u.fechaNacimiento }} ({{ u.edad }} años)</dd></div>
            <div><dt>Rol</dt><dd>{{ u.rol | etiqueta }}</dd></div>
            <div><dt>Estado</dt><dd><app-badge [valor]="u.estado" /></dd></div>
            <div><dt>Registrado</dt><dd>{{ u.fechaRegistro | date: 'dd/MM/yyyy HH:mm' }}</dd></div>
            @if (u.fechaAprobacion) { <div><dt>Aprobado</dt><dd>{{ u.fechaAprobacion | date: 'dd/MM/yyyy HH:mm' }}</dd></div> }
            @if (socio(); as s) {
              <div><dt>Afiliación</dt><dd>{{ s.fechaAfiliacion }}</dd></div>
              <div><dt>Objetivo</dt><dd>{{ s.objetivo || '—' }}</dd></div>
            }
            @if (entrenador(); as e) {
              <div><dt>Especialidad</dt><dd>{{ e.especialidad }}</dd></div>
              <div><dt>Ingreso</dt><dd>{{ e.fechaIngreso }}</dd></div>
              <div><dt>Clases a cargo</dt><dd>{{ e.totalClases }}</dd></div>
            }
          </dl>
        </section>

        @if (editable()) {
          <form class="bloque" [formGroup]="form" (ngSubmit)="guardar()" novalidate>
            <h2>Editar mis datos</h2>
            <p class="texto-suave">La cédula y el email no se pueden cambiar.</p>
            <label class="campo"><span>Nombres</span><input id="perfil-nombres" formControlName="nombres" />
              @if (err('nombres'); as e) { <small class="err">{{ e }}</small> }</label>
            <label class="campo"><span>Apellidos</span><input id="perfil-apellidos" formControlName="apellidos" />
              @if (err('apellidos'); as e) { <small class="err">{{ e }}</small> }</label>
            <label class="campo"><span>Celular</span><input id="perfil-celular" formControlName="celular" maxlength="10" />
              @if (err('celular'); as e) { <small class="err">{{ e }}</small> }</label>
            @if (entrenador()) {
              <label class="campo"><span>Especialidad</span><input id="perfil-especialidad" formControlName="especialidad" />
                @if (err('especialidad'); as e) { <small class="err">{{ e }}</small> }</label>
            } @else {
              <label class="campo"><span>Objetivo</span><input id="perfil-objetivo" formControlName="objetivo" />
                @if (err('objetivo'); as e) { <small class="err">{{ e }}</small> }</label>
            }
            <div class="acciones-izq">
              <button type="submit" class="btn btn-primario" [disabled]="guardando()">{{ guardando() ? 'Guardando…' : 'Guardar cambios' }}</button>
            </div>
          </form>
        }
      </div>
    }
  `,
})
export class Perfil implements OnInit {
  private auth = inject(AuthService);
  private socios = inject(SocioService);
  private entrenadores = inject(EntrenadorService);
  private notif = inject(NotificacionService);

  protected usuario = signal<Usuario | null>(null);
  protected socio = signal<Socio | null>(null);
  protected entrenador = signal<Entrenador | null>(null);
  protected editable = signal(false);
  protected cargando = signal(true);
  protected guardando = signal(false);
  protected error = signal<string | null>(null);

  protected form = inject(FormBuilder).nonNullable.group({
    nombres: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50), soloLetras]],
    apellidos: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50), soloLetras]],
    celular: ['', [Validators.required, celular]],
    objetivo: ['', Validators.maxLength(150)],
    especialidad: ['', Validators.maxLength(60)],
  });

  protected err(c: string) {
    return errorDe(this.form.get(c));
  }

  ngOnInit(): void {
    this.auth.perfil().subscribe({
      next: (u) => {
        this.usuario.set(u);
        this.cargando.set(false);
        if (u.rol === 'SOCIO') {
          this.socios.me().subscribe((s) => {
            this.socio.set(s);
            this.form.patchValue({ nombres: s.nombres, apellidos: s.apellidos, celular: s.celular, objetivo: s.objetivo ?? '' });
            this.editable.set(true);
          });
        } else if (u.rol === 'ENTRENADOR') {
          this.entrenadores.me().subscribe((e) => {
            this.entrenador.set(e);
            this.form.patchValue({ nombres: e.nombres, apellidos: e.apellidos, celular: e.celular, especialidad: e.especialidad });
            this.form.controls.especialidad.addValidators([Validators.required, Validators.minLength(3)]);
            this.editable.set(true);
          });
        }
      },
      error: (e) => {
        this.error.set(mensajeError(e));
        this.cargando.set(false);
      },
    });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.guardando.set(false);
      return;
    }
    const v = this.form.getRawValue();
    const fin = {
      next: () => {
        this.notif.exito('Datos actualizados');
        this.guardando.set(false);
        this.ngOnInit();
      },
      error: (e: unknown) => {
        aplicarErroresApi(this.form, e);
        this.notif.error(mensajeError(e));
        this.guardando.set(false);
      },
    };
    this.guardando.set(true);
    const s = this.socio();
    const en = this.entrenador();
    if (s) {
      this.socios.actualizar(s.id, { nombres: v.nombres, apellidos: v.apellidos, celular: v.celular, objetivo: v.objetivo || null }).subscribe(fin);
    } else if (en) {
      this.entrenadores.actualizar(en.id, { nombres: v.nombres, apellidos: v.apellidos, celular: v.celular, especialidad: v.especialidad }).subscribe(fin);
    }
  }
}
