import { afterEveryRender, Directive, ElementRef, HostListener, inject, OnDestroy, OnInit, output } from '@angular/core';
import { FormGroupDirective, NgControl, Validators } from '@angular/forms';

/**
 * Accesibilidad de campos de formulario (WCAG 1.3.1, 3.3.1, 4.1.2).
 * Se aplica sola a todo control con formControlName:
 *  - aria-invalid="true" cuando el campo tiene error y ya fue tocado.
 *  - aria-required="true" si el control usa Validators.required (el CSS añade el asterisco).
 *  - aria-describedby apunta a los mensajes de error/ayuda del mismo .campo, para que
 *    el lector de pantalla lea el error al enfocar el campo.
 */
@Directive({ selector: '[formControlName]' })
export class CampoAccesible {
  private el = inject<ElementRef<HTMLElement>>(ElementRef);
  private control = inject(NgControl, { self: true });
  private static contador = 0;

  constructor() {
    afterEveryRender(() => this.actualizar());
  }

  private actualizar(): void {
    const input = this.el.nativeElement;
    const c = this.control.control;
    if (!c) return;

    const invalido = c.invalid && (c.touched || c.dirty);
    input.setAttribute('aria-invalid', String(invalido));
    if (c.hasValidator(Validators.required)) input.setAttribute('aria-required', 'true');

    const campo = input.closest('.campo');
    // Nombre accesible explícito: enlaza el campo con el texto de su etiqueta
    const etiqueta = campo?.querySelector<HTMLElement>(':scope > span:first-child, :scope > label:first-child');
    if (etiqueta && !input.hasAttribute('aria-label')) {
      etiqueta.id ||= `etq-campo-${++CampoAccesible.contador}`;
      input.setAttribute('aria-labelledby', etiqueta.id);
    }
    const mensajes = campo ? Array.from(campo.querySelectorAll<HTMLElement>('.err, .ayuda')) : [];
    const ids = mensajes.map((m) => (m.id ||= `msg-campo-${++CampoAccesible.contador}`));
    if (ids.length) input.setAttribute('aria-describedby', ids.join(' '));
    else input.removeAttribute('aria-describedby');
  }
}

/**
 * Al enviar un formulario inválido, mueve el foco al primer campo con error
 * (prevención y recuperación de errores, heurística 9 de Nielsen / WCAG 3.3.1).
 */
@Directive({ selector: 'form[formGroup]' })
export class FormularioAccesible {
  private el = inject<ElementRef<HTMLFormElement>>(ElementRef);
  private fg = inject(FormGroupDirective);

  @HostListener('submit')
  alEnviar(): void {
    if (this.fg.form.valid) return;
    setTimeout(() => {
      const primero = this.el.nativeElement.querySelector<HTMLElement>('input.ng-invalid, select.ng-invalid, textarea.ng-invalid');
      primero?.focus();
    });
  }
}

/**
 * Hace que los contenedores de tablas con scroll horizontal se puedan
 * recorrer con teclado (WCAG 2.1.1) y los anuncia como región.
 */
@Directive({
  selector: '.tabla-cont',
  host: { tabindex: '0', role: 'region', 'aria-label': 'Tabla de datos (desplazable)' },
})
export class TablaDesplazable {}

const ENFOCABLES = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Ventanas modales accesibles (WCAG 2.1.2, 2.4.3; patrón "Dialog" de WAI-ARIA APG):
 *  - Al abrir, el foco entra al diálogo; al cerrar, vuelve al botón que lo abrió.
 *  - Tab / Shift+Tab quedan atrapados dentro del diálogo.
 *  - Escape cierra el diálogo.
 */
@Directive({ selector: '[dialogoAccesible]' })
export class DialogoAccesible implements OnInit, OnDestroy {
  private el = inject<ElementRef<HTMLElement>>(ElementRef);
  private anterior: HTMLElement | null = null;
  readonly escape = output<void>();

  ngOnInit(): void {
    this.anterior = document.activeElement as HTMLElement | null;
    setTimeout(() => {
      const raiz = this.el.nativeElement;
      const campo = raiz.querySelector<HTMLElement>('input:not([disabled]), select:not([disabled]), textarea:not([disabled])');
      // Sin campos: foco en la acción menos destructiva (Cancelar), según WAI-ARIA APG
      (campo ?? raiz.querySelector<HTMLElement>('.acciones button:first-child') ?? raiz).focus();
    });
  }

  ngOnDestroy(): void {
    this.anterior?.focus?.();
  }

  @HostListener('keydown', ['$event'])
  teclado(ev: KeyboardEvent): void {
    if (ev.key === 'Escape') {
      ev.stopPropagation();
      this.escape.emit();
      return;
    }
    if (ev.key !== 'Tab') return;
    const items = Array.from(this.el.nativeElement.querySelectorAll<HTMLElement>(ENFOCABLES));
    if (!items.length) return;
    const primero = items[0];
    const ultimo = items[items.length - 1];
    if (ev.shiftKey && document.activeElement === primero) {
      ultimo.focus();
      ev.preventDefault();
    } else if (!ev.shiftKey && document.activeElement === ultimo) {
      primero.focus();
      ev.preventDefault();
    }
  }
}

/** Todo lo de accesibilidad para importar de una vez en los componentes. */
export const A11Y = [CampoAccesible, FormularioAccesible, TablaDesplazable, DialogoAccesible] as const;
