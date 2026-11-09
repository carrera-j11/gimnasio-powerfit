import { CurrencyPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Plan } from '../../core/models';
import { PlanService } from '../../core/services/api.services';
import { AuthService } from '../../core/services/auth.service';
import { mensajeError } from '../../shared/utils';
import { Estado } from '../../shared/ui';
import { A11Y } from '../../shared/a11y';

@Component({
  selector: 'app-inicio',
  imports: [...A11Y, RouterLink, CurrencyPipe, Estado],
  template: `
    <header class="pub-cab">
      <a routerLink="/" class="marca"><span class="disco" aria-hidden="true"></span> POWERFIT</a>
      <nav class="pub-nav">
        @if (auth.autenticado()) {
          <a routerLink="/panel" class="btn btn-primario">Ir a mi panel</a>
        } @else {
          <a routerLink="/login" class="btn">Iniciar sesión</a>
          <a routerLink="/registro" class="btn btn-primario">Registrarse</a>
        }
      </nav>
    </header>

    <section class="hero">
      <div class="hero-txt">
        <p class="sobre">Gimnasio PowerFit</p>
        <h1>Entrena con plan, clase y entrenador.</h1>
        <p class="hero-lede">
          Elige tu membresía, inscríbete en las clases grupales y sigue tus pagos desde un solo lugar.
          Registra tu cuenta, verifica tu correo y espera la aprobación del administrador.
        </p>
        <div class="acciones-izq">
          <a routerLink="/registro" class="btn btn-primario btn-grande">Crear mi cuenta</a>
          <a routerLink="/login" class="btn btn-grande">Ya tengo cuenta</a>
        </div>
      </div>
      <div class="hero-discos" aria-hidden="true">
        <span class="d d25"></span><span class="d d20"></span><span class="d d15"></span><span class="d d10"></span>
      </div>
    </section>

    <section class="pub-seccion">
      <h2 class="titulo-seccion">Planes de membresía</h2>
      <app-estado [cargando]="cargando()" [error]="error()" [vacio]="!cargando() && !planes().length" />
      <div class="planes">
        @for (p of planes(); track p.id) {
          <article class="plan" [class.plan-destacado]="p.tipo === 'MENSUAL'">
            <p class="plan-tipo">{{ p.nombre }}</p>
            <p class="plan-precio">{{ p.precio | currency: 'USD' : 'symbol' : '1.2-2' }}</p>
            <p class="plan-dias">{{ p.duracionDias }} días de acceso</p>
            <p class="plan-desc">{{ p.descripcion || 'Acceso al gimnasio y a las clases grupales con cupo disponible.' }}</p>
            <a routerLink="/registro" class="btn" [class.btn-primario]="p.tipo === 'MENSUAL'">Quiero este plan</a>
          </article>
        }
      </div>
    </section>

    <section class="pub-seccion pasos">
      <h2 class="titulo-seccion">Cómo obtener tu cuenta</h2>
      <ol class="lista-pasos">
        <li><strong>Regístrate</strong> con tu cédula, correo y celular, y elige tu rol.</li>
        <li><strong>Verifica tu correo</strong> con el código de 6 dígitos que te llega; vence en 15 minutos.</li>
        <li><strong>Espera la aprobación:</strong> el administrador revisa tu registro.</li>
        <li><strong>Inicia sesión</strong> y empieza a usar el sistema.</li>
      </ol>
    </section>

    <footer class="pub-pie">Gimnasio PowerFit · Aplicación Angular conectada a la API REST de Spring Boot</footer>
  `,
})
export class Inicio implements OnInit {
  protected auth = inject(AuthService);
  private planService = inject(PlanService);

  protected planes = signal<Plan[]>([]);
  protected cargando = signal(true);
  protected error = signal<string | null>(null);

  ngOnInit(): void {
    this.planService.listar().subscribe({
      next: (p) => {
        this.planes.set(p);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(mensajeError(e));
        this.cargando.set(false);
      },
    });
  }
}
