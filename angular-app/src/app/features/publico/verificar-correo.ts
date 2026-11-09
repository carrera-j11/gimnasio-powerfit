import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { aplicarErroresApi, codigo6, errorDe, mensajeError } from '../../shared/utils';
import { A11Y } from '../../shared/a11y';

/** La persona confirma su correo con el código recibido. Después, el ADMIN revisa la cuenta. */
@Component({
  selector: 'app-verificar-correo',
  imports: [...A11Y, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-pagina">
      @if (exito(); as mensaje) {
        <div class="auth-caja">
          <a routerLink="/" class="marca"><span class="disco" aria-hidden="true"></span> POWERFIT</a>
          <h1>Correo verificado</h1>
          <div class="alerta alerta-exito" role="status">{{ mensaje }}</div>
          <p>Todavía no puedes iniciar sesión. Podrás ingresar cuando un administrador apruebe tu cuenta.</p>
          <a routerLink="/" class="btn btn-primario btn-bloque">Volver al inicio</a>
        </div>
      } @else {
        <form class="auth-caja" [formGroup]="form" (ngSubmit)="enviar()" novalidate>
          <a routerLink="/" class="marca"><span class="disco" aria-hidden="true"></span> POWERFIT</a>
          <h1>Verificar correo</h1>
          <p class="texto-suave">Escribe el código de 6 dígitos que enviamos a tu correo. Vence en 15 minutos.</p>

          @if (error()) { <div class="alerta alerta-error" role="alert">{{ error() }}</div> }

          <label class="campo">
            <span>Email</span>
            <input id="ver-email" type="email" formControlName="email" autocomplete="email" />
            @if (err('email'); as e) { <small class="err">{{ e }}</small> }
          </label>
          <label class="campo">
            <span>Código de verificación</span>
            <input id="ver-codigo" formControlName="codigo" inputmode="numeric" maxlength="6" class="input-codigo" placeholder="000000" autocomplete="one-time-code" />
            @if (err('codigo'); as e) { <small class="err">{{ e }}</small> }
          </label>

          <button type="submit" class="btn btn-primario btn-bloque" [disabled]="enviando()">
            {{ enviando() ? 'Verificando…' : 'Verificar correo' }}
          </button>
          <p class="auth-pie">¿No llegó o venció el código? <a routerLink="/reenviar-codigo">Pide uno nuevo</a></p>
        </form>
      }
    </div>
  `,
})
export class VerificarCorreo implements OnInit {
  private auth = inject(AuthService);
  private ruta = inject(ActivatedRoute);

  protected form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    codigo: ['', [Validators.required, codigo6]],
  });
  protected enviando = signal(false);
  protected exito = signal<string | null>(null);
  protected error = signal<string | null>(null);

  ngOnInit(): void {
    const email = this.ruta.snapshot.queryParamMap.get('email');
    if (email) this.form.controls.email.setValue(email);
  }

  protected err(campo: string) {
    return errorDe(this.form.get(campo));
  }

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set(null);
      return;
    }
    const v = this.form.getRawValue();
    this.enviando.set(true);
    this.error.set(null);
    this.auth.verificarCodigo(v.email.trim(), v.codigo).subscribe({
      next: (r) => {
        this.exito.set(r.mensaje);
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
