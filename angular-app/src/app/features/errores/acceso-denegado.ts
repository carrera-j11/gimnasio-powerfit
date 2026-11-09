import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { A11Y } from '../../shared/a11y';

@Component({
  selector: 'app-acceso-denegado',
  imports: [...A11Y, RouterLink],
  template: `
    <div class="pagina-error">
      <p class="codigo-error">403</p>
      <h1>Acceso denegado</h1>
      <p>Su rol no tiene permiso para ver esta página.</p>
      <a routerLink="/panel" class="btn btn-primario">Volver al panel</a>
    </div>
  `,
})
export class AccesoDenegado {}
