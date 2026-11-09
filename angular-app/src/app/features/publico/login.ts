import { Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { errorDe, mensajeError } from '../../shared/utils';
import { A11Y } from '../../shared/a11y';

@Component({
  selector: 'app-login',
  imports: [...A11Y, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-pagina">
      <form class="auth-caja" [formGroup]="form" (ngSubmit)="enviar()" novalidate>
        <a routerLink="/" class="marca"><span class="disco" aria-hidden="true"></span> POWERFIT</a>
        <h1>Iniciar sesión</h1>

        <p class="texto-suave nota-obligatorio">Los campos marcados con <span aria-hidden="true">*</span> son obligatorios.</p>
        @if (expirada()) {
          <div class="alerta" role="status">Tu sesión expiró. Vuelve a iniciar sesión.</div>
        }
        @if (error()) {
          <div class="alerta alerta-error" role="alert">{{ error() }}</div>
        }

        <label class="campo">
          <span>Email</span>
          <input id="login-email" type="email" inputmode="email" placeholder="tucorreo@ejemplo.com" formControlName="email" autocomplete="username" />
          @if (err('email'); as e) { <small class="err">{{ e }}</small> }
        </label>
        <div class="campo">
          <label for="login-password">Contraseña</label>
          <span class="con-boton"><input id="login-password" [type]="verClave() ? 'text' : 'password'" formControlName="password" autocomplete="current-password" />
              <button type="button" class="btn-ver" (click)="verClave.set(!verClave())" [attr.aria-pressed]="verClave()" [attr.aria-label]="verClave() ? 'Ocultar contraseña' : 'Mostrar contraseña'">{{ verClave() ? 'Ocultar' : 'Ver' }}</button></span>
          @if (err('password'); as e) { <small class="err">{{ e }}</small> }
        </div>

        <button type="submit" class="btn btn-primario btn-bloque" [disabled]="enviando()">
          {{ enviando() ? 'Ingresando…' : 'Ingresar' }}
        </button>

        <p class="auth-pie">
          ¿No tienes cuenta? <a routerLink="/registro">Regístrate</a><br />
          ¿Recibiste un código? <a routerLink="/verificar-correo">Verifica tu correo</a>
        </p>
      </form>
    </div>
  `,
})
export class Login {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  /** ?expirada=1 cuando la sesión se cerró porque venció el token. */
  expirada = input<string>();

  protected form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  protected enviando = signal(false);
  protected verClave = signal(false);
  protected error = signal<string | null>(null);

  protected err(campo: string) {
    return errorDe(this.form.get(campo));
  }

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set(null);
      return;
    }
    this.enviando.set(true);
    this.error.set(null);
    const { email, password } = this.form.getRawValue();
    this.auth.login(email.trim(), password).subscribe({
      next: () => this.router.navigate(['/panel']),
      error: (e) => {
        // 401 credenciales incorrectas · 403 cuenta pendiente o rechazada (el mensaje lo explica)
        this.error.set(mensajeError(e));
        this.enviando.set(false);
      },
    });
  }
}
