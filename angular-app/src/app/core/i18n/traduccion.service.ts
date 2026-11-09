import { effect, inject, Injectable } from '@angular/core';
import { PreferenciasService } from '../services/preferencias.service';
import { EN, PREFIJOS_EN } from './diccionario-en';

const ATRIBUTOS = ['placeholder', 'aria-label', 'title'] as const;
const NUMERO = /\d+(?:[.,]\d+)*/g;

/**
 * Cambio de idioma español ↔ inglés (WCAG 3.1.1 Idioma de la página).
 *
 * La interfaz está escrita en español dentro de las plantillas. En lugar de reescribir
 * los 26 componentes, este servicio observa el DOM con un MutationObserver y sustituye
 * cada texto, placeholder, aria-label y title que exista en el diccionario. También
 * traduce los textos que Angular vuelve a pintar (contadores, mensajes de validación, etc.).
 * Al volver a español restaura el texto original de cada nodo.
 * <html lang> se actualiza para que el lector de pantalla use la pronunciación correcta.
 */
@Injectable({ providedIn: 'root' })
export class TraduccionService {
  private prefs = inject(PreferenciasService);
  private observador: MutationObserver | null = null;
  /** Texto original (español) de cada nodo o atributo traducido. */
  private originales = new Map<Node, string>();
  private atributosOriginales = new Map<Element, Map<string, string>>();
  private tituloOriginal = '';
  private plantillas = new Map<string, string>();

  constructor() {
    // Claves con {n} → expresión regular normalizada
    for (const [es, en] of Object.entries(EN)) {
      if (es.includes('{n}')) this.plantillas.set(es, en);
    }
    effect(() => {
      if (this.prefs.prefs().idioma === 'en') this.activar();
      else this.desactivar();
    });
  }

  /** Traduce un texto suelto (para mensajes generados en código, como los toasts). */
  t(texto: string): string {
    return this.prefs.prefs().idioma === 'en' ? (this.traducir(texto) ?? texto) : texto;
  }

  private activar(): void {
    if (this.observador) return;
    this.recorrer(document.body);
    this.traducirTitulo();
    this.observador = new MutationObserver((cambios) => {
      for (const c of cambios) {
        if (c.type === 'characterData') this.traducirNodo(c.target);
        else if (c.type === 'attributes' && c.target instanceof Element) this.traducirAtributos(c.target);
        else c.addedNodes.forEach((n) => this.recorrer(n));
      }
      this.traducirTitulo();
    });
    this.observador.observe(document.documentElement, {
      subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: [...ATRIBUTOS],
    });
  }

  private desactivar(): void {
    if (!this.observador) return;
    this.observador.disconnect();
    this.observador = null;
    this.originales.forEach((texto, nodo) => {
      if (nodo.isConnected) nodo.textContent = texto;
    });
    this.atributosOriginales.forEach((attrs, el) => {
      if (el.isConnected) attrs.forEach((v, nombre) => el.setAttribute(nombre, v));
    });
    this.originales.clear();
    this.atributosOriginales.clear();
    if (this.tituloOriginal) document.title = this.tituloOriginal;
  }

  private recorrer(raiz: Node): void {
    if (raiz.nodeType === Node.TEXT_NODE) {
      this.traducirNodo(raiz);
      return;
    }
    if (!(raiz instanceof Element) || raiz.closest('script, style, [data-no-traducir]')) return;
    this.traducirAtributos(raiz);
    raiz.querySelectorAll<HTMLElement>('[placeholder], [aria-label], [title]').forEach((el) => this.traducirAtributos(el));
    const caminante = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
    while (caminante.nextNode()) this.traducirNodo(caminante.currentNode);
  }

  private traducirNodo(nodo: Node): void {
    const actual = nodo.textContent ?? '';
    const limpio = actual.trim();
    if (!limpio || nodo.parentElement?.closest('script, style, input, textarea, [data-no-traducir]')) return;
    // Los textos largos pueden venir partidos en varias líneas en la plantilla
    const traducido = this.traducir(limpio.replace(/\s+/g, ' '));
    if (traducido === null || traducido === limpio) return;
    // Si Angular cambió el texto (p. ej. un contador) guardamos el nuevo original
    this.originales.set(nodo, actual);
    nodo.textContent = actual.replace(limpio, traducido);
  }

  private traducirAtributos(el: Element): void {
    for (const nombre of ATRIBUTOS) {
      const valor = el.getAttribute(nombre);
      if (!valor) continue;
      const traducido = this.traducir(valor);
      if (traducido === null || traducido === valor) continue;
      if (!this.atributosOriginales.has(el)) this.atributosOriginales.set(el, new Map());
      this.atributosOriginales.get(el)!.set(nombre, valor);
      el.setAttribute(nombre, traducido);
    }
  }

  private traducirTitulo(): void {
    const traducido = this.traducir(document.title);
    if (traducido && traducido !== document.title) {
      this.tituloOriginal = document.title;
      document.title = traducido;
    }
  }

  /** Busca el texto en el diccionario: exacto, con números variables o por prefijo. */
  private traducir(texto: string): string | null {
    if (EN[texto]) return EN[texto];
    const numeros = texto.match(NUMERO);
    if (numeros) {
      const plantilla = this.plantillas.get(texto.replace(NUMERO, '{n}'));
      if (plantilla) {
        let i = 0;
        return plantilla.replace(/\{n\}/g, () => numeros[i++] ?? '');
      }
    }
    for (const [es, en] of PREFIJOS_EN) {
      if (texto.startsWith(es) && texto.length > es.length) return en + texto.slice(es.length);
    }
    return null;
  }
}
