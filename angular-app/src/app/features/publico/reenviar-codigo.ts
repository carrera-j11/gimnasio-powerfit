import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { errorDe, mensajeError } from '../../shared/utils';
import { A11Y } from '../../shared/a11y';

@Component({
  selector: 'app-reenviar-codigo',
  imports: [...A11Y, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-pagina">
      <form class="auth-caja" [formGroup]="form" (ngSubmit)="enviar()" novalidate>
        <a routerLink="/" class="marca"><span class="disco" aria-hidden="true"></span> POWERFIT</a>
        <h1>Reenviar código</h1>
        <p class="texto-suave">Si tu código venció o agotaste los intentos, escribe el email con el que te registraste y te enviamos uno nuevo.</p>

        @if (exito()) { <div class="alerta alerta-exito">{{ exito() }}</div> }
        @if (error()) { <div class="alerta alerta-error" role="alert">{{ error() }}</div> }

        <label class="campo">
          <span>Email</span>
          <input id="reenviar-email" type="email" formControlName="email" autocomplete="email" />
          @if (err(); as e) { <small class="err">{{ e }}</small> }
        </label>
        <button type="submit" class="btn btn-primario btn-bloque" [disabled]="enviando()">
          {{ enviando() ? 'Enviando…' : 'Enviar nuevo código' }}
        </button>
        <p class="auth-pie"><a routerLink="/verificar-correo" [queryParams]="{ email: form.getRawValue().email }">Ya tengo el código</a></p>
      </form>
    </div>
  `,
})
export class ReenviarCodigo {
  private auth = inject(AuthService);
  protected form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });
  protected enviando = signal(false);
  protected exito = signal<string | null>(null);
  protected error = signal<string | null>(null);

  protected err() {
    return errorDe(this.form.controls.email);
  }

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set(null);
      return;
    }
    this.enviando.set(true);
    this.exito.set(null);
    this.error.set(null);
    this.auth.reenviarCodigo(this.form.getRawValue().email.trim()).subscribe({
      next: (r) => {
        this.exito.set(r.mensaje);
        this.enviando.set(false);
      },
      error: (e) => {
        this.error.set(mensajeError(e));
        this.enviando.set(false);
      },
    });
  }
}
