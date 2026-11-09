import { Injectable, signal } from '@angular/core';

export interface Aviso {
  id: number;
  tipo: 'exito' | 'error';
  texto: string;
}

export interface Confirmacion {
  titulo: string;
  texto: string;
  boton: string;
  resolver: (ok: boolean) => void;
}

/** Mensajes emergentes (toasts) y diálogo de confirmación antes de eliminar o cancelar. */
@Injectable({ providedIn: 'root' })
export class NotificacionService {
  readonly avisos = signal<Aviso[]>([]);
  readonly confirmacion = signal<Confirmacion | null>(null);
  private siguienteId = 1;
  private temporizadores = new Map<number, ReturnType<typeof setTimeout>>();

  exito(texto: string): void {
    this.mostrar('exito', texto);
  }

  error(texto: string): void {
    this.mostrar('error', texto, 10000);
  }

  /** El mensaje no desaparece mientras el usuario lo lee (WCAG 2.2.1 Tiempo ajustable). */
  pausar(id: number): void {
    clearTimeout(this.temporizadores.get(id));
    this.temporizadores.delete(id);
  }

  cerrar(id: number): void {
    this.pausar(id);
    this.avisos.update((lista) => lista.filter((a) => a.id !== id));
  }

  confirmar(titulo: string, texto: string, boton = 'Eliminar'): Promise<boolean> {
    return new Promise((resolve) => {
      this.confirmacion.set({
        titulo,
        texto,
        boton,
        resolver: (ok) => {
          this.confirmacion.set(null);
          resolve(ok);
        },
      });
    });
  }

  private mostrar(tipo: Aviso['tipo'], texto: string, ms = 6000): void {
    const id = this.siguienteId++;
    this.avisos.update((lista) => [...lista, { id, tipo, texto }]);
    this.temporizadores.set(id, setTimeout(() => this.cerrar(id), ms));
  }
}
