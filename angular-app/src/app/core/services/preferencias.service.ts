import { effect, Injectable, signal } from '@angular/core';

export type Tema = 'sistema' | 'claro' | 'oscuro';
export type Paleta = 'estandar' | 'daltonismo' | 'contraste';
export type Idioma = 'es' | 'en';

export interface Preferencias {
  tema: Tema;
  paleta: Paleta;
  /** Tamaño del texto en % (100 = 16px). */
  escala: number;
  idioma: Idioma;
  espaciado: boolean;
  subrayarEnlaces: boolean;
  reducirMovimiento: boolean;
}

const CLAVE = 'powerfit.preferencias';
export const ESCALA_MIN = 75;
export const ESCALA_MAX = 125;
const PASO = 12.5;

const POR_DEFECTO: Preferencias = {
  tema: 'sistema',
  paleta: 'estandar',
  escala: 100,
  idioma: 'es',
  espaciado: false,
  subrayarEnlaces: false,
  reducirMovimiento: false,
};

/**
 * Preferencias de accesibilidad del usuario: modo nocturno, paleta de colores,
 * tamaño de texto, idioma, espaciado, enlaces subrayados y animaciones.
 * Se guardan en localStorage y se aplican como atributos data-* en <html>,
 * de modo que el CSS (styles.css) adapta toda la aplicación sin tocar los componentes.
 */
@Injectable({ providedIn: 'root' })
export class PreferenciasService {
  readonly prefs = signal<Preferencias>(this.leer());
  /** Tema efectivo (resuelve "sistema" con prefers-color-scheme). */
  readonly temaEfectivo = signal<'claro' | 'oscuro'>('claro');
  /** Estado del panel de accesibilidad (abierto / solo la lista de atajos). */
  readonly panelAbierto = signal(false);
  readonly soloAtajos = signal(false);
  private consulta = window.matchMedia('(prefers-color-scheme: dark)');

  constructor() {
    this.consulta.addEventListener('change', () => this.aplicar(this.prefs()));
    effect(() => {
      const p = this.prefs();
      this.aplicar(p);
      try {
        localStorage.setItem(CLAVE, JSON.stringify(p));
      } catch {
        /* almacenamiento no disponible (modo privado): las preferencias duran la sesión */
      }
    });
  }

  cambiar<K extends keyof Preferencias>(clave: K, valor: Preferencias[K]): void {
    this.prefs.update((p) => ({ ...p, [clave]: valor }));
  }

  /** Devuelve el tema que quedó activo. */
  alternarTema(): 'claro' | 'oscuro' {
    const nuevo = this.temaEfectivo() === 'oscuro' ? 'claro' : 'oscuro';
    this.cambiar('tema', nuevo);
    return nuevo;
  }

  agrandarTexto(): void {
    this.cambiar('escala', Math.min(ESCALA_MAX, this.prefs().escala + PASO));
  }

  achicarTexto(): void {
    this.cambiar('escala', Math.max(ESCALA_MIN, this.prefs().escala - PASO));
  }

  alternarIdioma(): void {
    this.cambiar('idioma', this.prefs().idioma === 'es' ? 'en' : 'es');
  }

  restablecer(): void {
    this.prefs.set({ ...POR_DEFECTO });
  }

  private aplicar(p: Preferencias): void {
    const raiz = document.documentElement;
    const oscuro = p.tema === 'oscuro' || (p.tema === 'sistema' && this.consulta.matches);
    this.temaEfectivo.set(oscuro ? 'oscuro' : 'claro');
    raiz.dataset['tema'] = oscuro ? 'oscuro' : 'claro';
    raiz.dataset['paleta'] = p.paleta;
    raiz.dataset['espaciado'] = p.espaciado ? 'amplio' : 'normal';
    raiz.dataset['enlaces'] = p.subrayarEnlaces ? 'subrayados' : 'normal';
    raiz.dataset['movimiento'] = p.reducirMovimiento ? 'reducido' : 'normal';
    // El tamaño se aplica en <html>: todas las fuentes en rem escalan a la vez (WCAG 1.4.4)
    raiz.style.fontSize = `${p.escala}%`;
    raiz.lang = p.idioma;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', oscuro ? '#0a0d12' : '#161a23');
  }

  private leer(): Preferencias {
    try {
      const guardado = JSON.parse(localStorage.getItem(CLAVE) ?? 'null');
      if (!guardado) return { ...POR_DEFECTO };
      const p: Preferencias = { ...POR_DEFECTO, ...guardado };
      // Un valor guardado fuera del rango permitido se ajusta al límite
      p.escala = Math.min(ESCALA_MAX, Math.max(ESCALA_MIN, Number(p.escala) || 100));
      return p;
    } catch {
      return { ...POR_DEFECTO };
    }
  }
}
