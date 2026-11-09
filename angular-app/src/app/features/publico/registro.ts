import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RegistroResponse, Rol } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import {
  aplicarErroresApi, cedula, celular, edadMinima, errorDe, mensajeError, passwordSegura, soloLetras,
} from '../../shared/utils';
import { A11Y } from '../../shared/a11y';

@Component({
  selector: 'app-registro',
  imports: [...A11Y, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-pagina">
      @if (resultado(); as r) {
        <div class="auth-caja">
          <a routerLink="/" class="marca"><span class="disco" aria-hidden="true"></span> POWERFIT</a>
          <h1>Registro enviado</h1>
          <div class="alerta alerta-exito">{{ r.mensaje }}</div>
          <dl class="datos">
            <div><dt>Email</dt><dd>{{ r.email }}</dd></div>
            <div><dt>Rol solicitado</dt><dd>{{ r.rolSolicitado }}</dd></div>
            <div><dt>Número de solicitud</dt><dd>{{ r.usuarioId }}</dd></div>
          </dl>
          <p>Revisa tu correo: llegó un código de 6 dígitos que vence en 15 minutos. Después de verificarlo, un administrador revisará tu cuenta.</p>
          <a routerLink="/verificar-correo" [queryParams]="{ email: r.email }" class="btn btn-primario btn-bloque">Ingresar el código</a>
          <p class="auth-pie">¿No llegó el código? <a routerLink="/reenviar-codigo">Reenviar</a></p>
        </div>
      } @else {
        <form class="auth-caja auth-ancha" [formGroup]="form" (ngSubmit)="enviar()" novalidate>
          <a routerLink="/" class="marca"><span class="disco" aria-hidden="true"></span> POWERFIT</a>
          <h1>Crear cuenta</h1>
          @if (error()) { <div class="alerta alerta-error" role="alert">{{ error() }}</div> }

          <div class="rejilla-2">
            <label class="campo">
              <span>Rol que solicita</span>
              <select id="reg-rol" formControlName="rolSolicitado">
                <option value="SOCIO">Socio (cliente)</option>
                <option value="ENTRENADOR">Entrenador</option>
                <option value="RECEPCIONISTA">Recepcionista</option>
                <option value="ADMIN">Administrador</option>
              </select>
              @if (rol() === 'ADMIN') {
                <small class="ayuda">Máximo 3 administradores. Tu cuenta la aprueba el administrador principal.</small>
              }
            </label>
            <label class="campo">
              <span>Cédula</span>
              <input id="reg-cedula" formControlName="cedula" inputmode="numeric" maxlength="10" />
              @if (err('cedula'); as e) { <small class="err">{{ e }}</small> }
            </label>
            <label class="campo">
              <span>Nombres</span>
              <input id="reg-nombres" formControlName="nombres" />
              @if (err('nombres'); as e) { <small class="err">{{ e }}</small> }
            </label>
            <label class="campo">
              <span>Apellidos</span>
              <input id="reg-apellidos" formControlName="apellidos" />
              @if (err('apellidos'); as e) { <small class="err">{{ e }}</small> }
            </label>
            <label class="campo">
              <span>Email</span>
              <input id="reg-email" type="email" formControlName="email" autocomplete="email" />
              @if (err('email'); as e) { <small class="err">{{ e }}</small> }
            </label>
            <label class="campo">
              <span>Celular</span>
              <input id="reg-celular" formControlName="celular" inputmode="numeric" maxlength="10" placeholder="09XXXXXXXX" />
              @if (err('celular'); as e) { <small class="err">{{ e }}</small> }
            </label>
            <label class="campo">
              <span>Fecha de nacimiento</span>
              <input id="reg-fecha" type="date" formControlName="fechaNacimiento" />
              @if (err('fechaNacimiento'); as e) { <small class="err">{{ e }}</small> }
            </label>
            @if (rol() === 'ENTRENADOR') {
              <label class="campo">
                <span>Especialidad</span>
                <input id="reg-especialidad" formControlName="especialidad" placeholder="Ej. Crossfit, Yoga, Spinning" />
                @if (err('especialidad'); as e) { <small class="err">{{ e }}</small> }
              </label>
            }
            @if (rol() === 'SOCIO') {
              <label class="campo">
                <span>Objetivo (opcional)</span>
                <input id="reg-objetivo" formControlName="objetivo" placeholder="Ej. Bajar de peso" />
                @if (err('objetivo'); as e) { <small class="err">{{ e }}</small> }
              </label>
            }
            <div class="campo">
              <label for="reg-password">Contraseña</label>
              <span class="con-boton"><input id="reg-password" [type]="verClave() ? 'text' : 'password'" formControlName="password" autocomplete="new-password" />
              <button type="button" class="btn-ver" (click)="verClave.set(!verClave())" [attr.aria-pressed]="verClave()" [attr.aria-label]="verClave() ? 'Ocultar contraseña' : 'Mostrar contraseña'">{{ verClave() ? 'Ocultar' : 'Ver' }}</button></span>
              @if (err('password'); as e) { <small class="err">{{ e }}</small> }
              @else { <small class="ayuda">8+ caracteres, mayúscula, minúscula, número y símbolo</small> }
            </div>
            <div class="campo">
              <label for="reg-confirmar">Confirmar contraseña</label>
              <span class="con-boton"><input id="reg-confirmar" [type]="verClave() ? 'text' : 'password'" formControlName="confirmarPassword" autocomplete="new-password" />
              <button type="button" class="btn-ver" (click)="verClave.set(!verClave())" [attr.aria-pressed]="verClave()" [attr.aria-label]="verClave() ? 'Ocultar contraseña' : 'Mostrar contraseña'">{{ verClave() ? 'Ocultar' : 'Ver' }}</button></span>
              @if (err('confirmarPassword'); as e) { <small class="err">{{ e }}</small> }
            </div>
          </div>

          <button type="submit" class="btn btn-primario btn-bloque" [disabled]="enviando()">
            {{ enviando() ? 'Enviando… (se envía el correo)' : 'Registrarme' }}
          </button>
          <p class="auth-pie">¿Ya tienes cuenta? <a routerLink="/login">Inicia sesión</a></p>
        </form>
      }
    </div>
  `,
})
export class Registro {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);

  protected rol = signal<Rol>('SOCIO');
  protected enviando = signal(false);
  protected verClave = signal(false);
  protected error = signal<string | null>(null);
  protected resultado = signal<RegistroResponse | null>(null);

  protected form = this.fb.nonNullable.group({
    rolSolicitado: ['SOCIO' as Rol],
    cedula: ['', [Validators.required, cedula]],
    nombres: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50), soloLetras]],
    apellidos: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50), soloLetras]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
    celular: ['', [Validators.required, celular]],
    fechaNacimiento: ['', [Validators.required, edadMinima(() => (this.rol() === 'SOCIO' ? 15 : 18))]],
    especialidad: ['', Validators.maxLength(60)],
    objetivo: ['', Validators.maxLength(150)],
    password: ['', [Validators.required, passwordSegura]],
    confirmarPassword: ['', [Validators.required, (c: AbstractControl) => this.coincide(c)]],
  });

  constructor() {
    this.form.controls.rolSolicitado.valueChanges.subscribe((r) => {
      this.rol.set(r);
      const esp = this.form.controls.especialidad;
      esp.setValidators(r === 'ENTRENADOR' ? [Validators.required, Validators.minLength(3), Validators.maxLength(60)] : []);
      esp.updateValueAndValidity();
      this.form.controls.fechaNacimiento.updateValueAndValidity();
    });
    this.form.controls.password.valueChanges.subscribe(() =>
      this.form.controls.confirmarPassword.updateValueAndValidity({ emitEvent: false }),
    );
  }

  private coincide(c: AbstractControl): ValidationErrors | null {
    const pass = this.form?.controls.password.value;
    return c.value && pass !== c.value ? { coincide: 'Las contraseñas no coinciden' } : null;
  }

  protected err(campo: string) {
    return errorDe(this.form.get(campo));
  }

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Revisa los campos marcados.');
      return;
    }
    this.enviando.set(true);
    this.error.set(null);
    const v = this.form.getRawValue();
    this.auth
      .registrar({
        ...v,
        email: v.email.trim(),
        nombres: v.nombres.trim(),
        apellidos: v.apellidos.trim(),
        especialidad: v.rolSolicitado === 'ENTRENADOR' ? v.especialidad.trim() : null,
        objetivo: v.rolSolicitado === 'SOCIO' && v.objetivo.trim() ? v.objetivo.trim() : null,
      })
      .subscribe({
        next: (r) => {
          this.resultado.set(r);
          this.enviando.set(false);
        },
        error: (e) => {
          aplicarErroresApi(this.form, e);
          this.error.set(mensajeError(e));
          this.enviando.set(false);
        },
      });
  }
}
