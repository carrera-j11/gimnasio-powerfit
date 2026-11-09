import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { A11Y } from '../../shared/a11y';

@Component({
  selector: 'app-no-encontrado',
  imports: [...A11Y, RouterLink],
  template: `
    <div class="pagina-error pagina-error-sola">
      <p class="codigo-error">404</p>
      <h1>Página no encontrada</h1>
      <p>La dirección que escribió no existe en PowerFit.</p>
      <a routerLink="/" class="btn btn-primario">Ir al inicio</a>
    </div>
  `,
})
export class NoEncontrado {}
