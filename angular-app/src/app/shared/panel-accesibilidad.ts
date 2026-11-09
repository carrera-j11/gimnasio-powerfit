import { NgTemplateOutlet } from '@angular/common';
import { Component, inject, output } from '@angular/core';
import { ESCALA_MAX, ESCALA_MIN, Idioma, Paleta, PreferenciasService, Tema } from '../core/services/preferencias.service';
import { DialogoAccesible } from './a11y';

/** Lista de atajos: se muestra en el panel y en la ayuda (tecla ?). */
export const ATAJOS: { teclas: string[]; texto: string }[] = [
  { teclas: ['Alt', 'Mayús', 'A'], texto: 'Abrir este panel de accesibilidad' },
  { teclas: ['Alt', 'Mayús', 'N'], texto: 'Activar o desactivar el modo nocturno' },
  { teclas: ['Alt', 'Mayús', '↑ / ↓'], texto: 'Aumentar / reducir el tamaño del texto' },
  { teclas: ['Alt', 'Mayús', '0'], texto: 'Restablecer el tamaño del texto' },
  { teclas: ['Alt', 'Mayús', 'L'], texto: 'Cambiar idioma (español / inglés)' },
  { teclas: ['Alt', 'Mayús', 'C'], texto: 'Ir al contenido principal' },
  { teclas: ['Alt', 'Mayús', 'M'], texto: 'Abrir o cerrar el menú' },
  { teclas: ['Alt', 'Mayús', 'P'], texto: 'Ir al panel' },
  { teclas: ['Alt', 'Mayús', 'B'], texto: 'Ir al buscador de la página' },
  { teclas: ['?'], texto: 'Mostrar esta lista de atajos' },
  { teclas: ['Esc'], texto: 'Cerrar ventanas y menús' },
];

/**
 * Panel de preferencias de accesibilidad (WCAG 1.4.3, 1.4.4, 1.4.8, 1.4.12, 2.1.4, 3.1.1).
 * Se abre con el botón flotante ♿ o con Alt+Mayús+A, y está disponible en todas las páginas.
 */
@Component({
  selector: 'app-panel-accesibilidad',
  imports: [DialogoAccesible, NgTemplateOutlet],
  template: `
    <div class="modal-fondo" (click)="cerrar.emit()">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="a11y-titulo"
           dialogoAccesible (escape)="cerrar.emit()" (click)="$event.stopPropagation()">
        <div class="modal-cab">
          <h2 class="modal-titulo" id="a11y-titulo">{{ soloAtajos() ? 'Atajos de teclado' : 'Opciones de accesibilidad' }}</h2>
          <button type="button" class="btn-icono" (click)="cerrar.emit()" aria-label="Cerrar">×</button>
        </div>

        @if (!soloAtajos()) {
          <div class="panel-a11y">
            <fieldset>
              <legend>Modo de color</legend>
              <div class="segmentado">
                @for (o of temas; track o.valor) {
                  <button type="button" class="btn" [attr.aria-pressed]="p().tema === o.valor" (click)="prefs.cambiar('tema', o.valor)">
                    <span aria-hidden="true">{{ o.icono }}</span> {{ o.texto }}
                  </button>
                }
              </div>
            </fieldset>

            <fieldset>
              <legend>Tamaño del texto</legend>
              <div class="tamano">
                <button type="button" class="btn" (click)="prefs.achicarTexto()" [disabled]="p().escala <= min" aria-label="Reducir texto">A−</button>
                <output aria-live="polite">{{ p().escala }}%</output>
                <button type="button" class="btn" (click)="prefs.agrandarTexto()" [disabled]="p().escala >= max" aria-label="Aumentar texto">A+</button>
                <button type="button" class="btn btn-sm" (click)="prefs.cambiar('escala', 100)" [disabled]="p().escala === 100">100%</button>
              </div>
            </fieldset>

            <fieldset>
              <legend>Paleta de colores</legend>
              <div class="segmentado">
                @for (o of paletas; track o.valor) {
                  <button type="button" class="btn" [attr.aria-pressed]="p().paleta === o.valor" (click)="prefs.cambiar('paleta', o.valor)">{{ o.texto }}</button>
                }
              </div>
              <p class="ayuda" style="margin: 8px 0 0">La paleta para daltonismo usa azul y naranja en lugar de verde y rojo.</p>
            </fieldset>

            <fieldset>
              <legend>Lectura</legend>
              <div class="interruptores">
                <label><input type="checkbox" [checked]="p().espaciado" (change)="prefs.cambiar('espaciado', $any($event.target).checked)" /> <span>Espaciado de texto amplio</span></label>
                <label><input type="checkbox" [checked]="p().subrayarEnlaces" (change)="prefs.cambiar('subrayarEnlaces', $any($event.target).checked)" /> <span>Subrayar todos los enlaces</span></label>
                <label><input type="checkbox" [checked]="p().reducirMovimiento" (change)="prefs.cambiar('reducirMovimiento', $any($event.target).checked)" /> <span>Reducir animaciones</span></label>
              </div>
            </fieldset>

            <fieldset>
              <legend>Idioma</legend>
              <div class="segmentado">
                @for (o of idiomas; track o.valor) {
                  <!-- data-no-traducir: el nombre de cada idioma se muestra siempre en su propio idioma -->
                  <button type="button" class="btn" data-no-traducir [attr.lang]="o.valor" [attr.aria-pressed]="p().idioma === o.valor" (click)="prefs.cambiar('idioma', o.valor)">{{ o.texto }}</button>
                }
              </div>
            </fieldset>
          </div>
        }

        <ng-template #listaAtajos>
          <p class="ayuda" style="margin: 8px 0">Los atajos usan Alt + Mayús + una tecla para no chocar con los del navegador ni del lector de pantalla.</p>
          <table class="atajos">
            <tbody>
              @for (a of atajos; track a.texto) {
                <tr>
                  <td>@for (k of a.teclas; track $index) { @if ($index) { + } <kbd>{{ k }}</kbd> }</td>
                  <td>{{ a.texto }}</td>
                </tr>
              }
            </tbody>
          </table>
        </ng-template>
        @if (soloAtajos()) {
          <ng-container [ngTemplateOutlet]="listaAtajos" />
        } @else {
          <details style="margin-top: 16px">
            <summary style="cursor: pointer; font-weight: 700">Atajos de teclado</summary>
            <ng-container [ngTemplateOutlet]="listaAtajos" />
          </details>
        }

        <div class="acciones">
          @if (!soloAtajos()) {
            <button type="button" class="btn" (click)="prefs.restablecer()">Restablecer todo</button>
          }
          <button type="button" class="btn btn-primario" (click)="cerrar.emit()">Cerrar</button>
        </div>
        <p class="ayuda" style="margin: 10px 0 0; text-align: right">Tus preferencias se guardan en este navegador.</p>
      </div>
    </div>
  `,
})
export class PanelAccesibilidad {
  protected prefs = inject(PreferenciasService);
  protected p = this.prefs.prefs;
  protected soloAtajos = this.prefs.soloAtajos;
  readonly cerrar = output<void>();

  protected min = ESCALA_MIN;
  protected max = ESCALA_MAX;
  protected atajos = ATAJOS;
  protected temas: { valor: Tema; texto: string; icono: string }[] = [
    { valor: 'claro', texto: 'Claro', icono: '☀' },
    { valor: 'oscuro', texto: 'Nocturno', icono: '☾' },
    { valor: 'sistema', texto: 'Según el sistema', icono: '⚙' },
  ];
  protected paletas: { valor: Paleta; texto: string }[] = [
    { valor: 'estandar', texto: 'Estándar' },
    { valor: 'daltonismo', texto: 'Daltonismo' },
    { valor: 'contraste', texto: 'Alto contraste' },
  ];
  protected idiomas: { valor: Idioma; texto: string }[] = [
    { valor: 'es', texto: 'Español' },
    { valor: 'en', texto: 'English' },
  ];
}
