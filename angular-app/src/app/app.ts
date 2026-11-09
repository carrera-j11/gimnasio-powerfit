import { Component, HostListener, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { TraduccionService } from './core/i18n/traduccion.service';
import { AuthService } from './core/services/auth.service';
import { NotificacionService } from './core/services/notificacion.service';
import { PreferenciasService } from './core/services/preferencias.service';
import { DialogoAccesible } from './shared/a11y';
import { PanelAccesibilidad } from './shared/panel-accesibilidad';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, DialogoAccesible, PanelAccesibilidad],
  template: `
    <router-outlet />

    <!-- Botón flotante de accesibilidad: visible en todas las páginas, públicas y privadas -->
    <button type="button" class="btn-a11y" (click)="abrirPanel(false)" aria-label="Opciones de accesibilidad"
            title="Opciones de accesibilidad (Alt+Mayús+A)" [attr.aria-expanded]="prefs.panelAbierto()">
      <span aria-hidden="true">♿</span>
    </button>
    @if (prefs.panelAbierto()) {
      <app-panel-accesibilidad (cerrar)="prefs.panelAbierto.set(false)" />
    }

    <!-- Mensajes emergentes -->
    <!-- Errores con role=alert (se anuncian de inmediato); éxitos con role=status (cortesía) -->
    <div class="toasts">
      @for (a of notif.avisos(); track a.id) {
        <div class="toast" [class.toast-error]="a.tipo === 'error'" [attr.role]="a.tipo === 'error' ? 'alert' : 'status'"
             (mouseenter)="notif.pausar(a.id)" (focusin)="notif.pausar(a.id)">
          <span class="toast-icono" aria-hidden="true">{{ a.tipo === 'error' ? '✕' : '✓' }}</span>
          <span class="toast-texto">{{ a.texto }}</span>
          <button type="button" class="toast-x" (click)="notif.cerrar(a.id)" aria-label="Cerrar mensaje">×</button>
        </div>
      }
    </div>

    <!-- Confirmación antes de eliminar o cancelar -->
    @if (notif.confirmacion(); as c) {
      <div class="modal-fondo" (click)="c.resolver(false)">
        <div class="modal modal-sm" role="alertdialog" aria-modal="true" aria-labelledby="conf-titulo" aria-describedby="conf-texto"
             dialogoAccesible (escape)="c.resolver(false)" (click)="$event.stopPropagation()">
          <h2 class="modal-titulo" id="conf-titulo">{{ c.titulo }}</h2>
          <p id="conf-texto">{{ c.texto }}</p>
          <div class="acciones">
            <button type="button" class="btn" (click)="c.resolver(false)">Cancelar</button>
            <button type="button" class="btn btn-peligro" (click)="c.resolver(true)">{{ c.boton }}</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class App {
  protected notif = inject(NotificacionService);
  protected prefs = inject(PreferenciasService);
  private router = inject(Router);
  private auth = inject(AuthService);
  private i18n = inject(TraduccionService); // se crea aquí para que observe toda la app

  protected abrirPanel(soloAtajos: boolean): void {
    this.prefs.soloAtajos.set(soloAtajos);
    this.prefs.panelAbierto.set(true);
  }

  /**
   * Atajos de teclado globales (WCAG 2.1.1 Teclado y 2.1.4 Atajos con una tecla).
   * Se usa Alt+Mayús para no chocar con los atajos del navegador ni de los lectores de pantalla,
   * y ev.code para que funcionen igual con teclado en español o en inglés.
   */
  @HostListener('document:keydown', ['$event'])
  protected atajo(ev: KeyboardEvent): void {
    const escribiendo = ev.target instanceof HTMLElement && ev.target.closest('input, textarea, select, [contenteditable]');
    if (ev.key === '?' && !escribiendo && !ev.ctrlKey && !ev.altKey) {
      ev.preventDefault();
      this.abrirPanel(true);
      return;
    }
    if (!ev.altKey || !ev.shiftKey || ev.ctrlKey || ev.metaKey) return;

    const acciones: Record<string, () => void> = {
      KeyA: () => this.abrirPanel(false),
      KeyN: () => {
        const tema = this.prefs.alternarTema();
        this.notif.exito(tema === 'oscuro' ? 'Modo nocturno activado' : 'Modo claro activado');
      },
      ArrowUp: () => this.anunciarTamano(() => this.prefs.agrandarTexto()),
      Equal: () => this.anunciarTamano(() => this.prefs.agrandarTexto()),
      NumpadAdd: () => this.anunciarTamano(() => this.prefs.agrandarTexto()),
      ArrowDown: () => this.anunciarTamano(() => this.prefs.achicarTexto()),
      Minus: () => this.anunciarTamano(() => this.prefs.achicarTexto()),
      NumpadSubtract: () => this.anunciarTamano(() => this.prefs.achicarTexto()),
      Digit0: () => this.anunciarTamano(() => this.prefs.cambiar('escala', 100)),
      KeyL: () => {
        this.prefs.alternarIdioma();
        this.notif.exito(this.prefs.prefs().idioma === 'en' ? 'Idioma: inglés' : 'Idioma: español');
      },
      KeyC: () => this.enfocar('#contenido, main, h1'),
      KeyM: () => window.dispatchEvent(new CustomEvent('powerfit:menu')),
      KeyP: () => this.router.navigate([this.auth.usuario() ? '/panel' : '/login']),
      KeyB: () => this.enfocar('.filtros input:not([type=checkbox]), input[type=search]'),
    };
    const accion = acciones[ev.code];
    if (accion) {
      ev.preventDefault();
      accion();
    }
  }

  private anunciarTamano(cambio: () => void): void {
    cambio();
    this.notif.exito(`Tamaño del texto: ${this.prefs.prefs().escala}%`);
  }

  private enfocar(selector: string): void {
    const el = document.querySelector<HTMLElement>(selector);
    if (!el) return;
    if (!el.matches('input, select, textarea, a, button') && !el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
    el.focus();
    el.scrollIntoView({ block: 'nearest' });
  }
}
