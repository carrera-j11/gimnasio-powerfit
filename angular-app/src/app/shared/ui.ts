import { Component, input, output, Pipe, PipeTransform } from '@angular/core';
import { DialogoAccesible } from './a11y';

/** Convierte los valores de los enums de la API en texto legible: PENDIENTE_APROBACION → Pendiente de aprobación */
const ETIQUETAS: Record<string, string> = {
  ADMIN: 'Administrador',
  RECEPCIONISTA: 'Recepcionista',
  ENTRENADOR: 'Entrenador',
  SOCIO: 'Socio',
  PENDIENTE_VERIFICACION: 'Pendiente de verificación',
  PENDIENTE_APROBACION: 'Pendiente de aprobación',
  APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada',
  ACTIVA: 'Activa',
  VENCIDA: 'Vencida',
  CANCELADA: 'Cancelada',
  QUINCENAL: 'Quincenal',
  MENSUAL: 'Mensual',
  ANUAL: 'Anual',
  EFECTIVO: 'Efectivo',
  TARJETA: 'Tarjeta',
  TRANSFERENCIA: 'Transferencia',
  LUNES: 'Lunes',
  MARTES: 'Martes',
  MIERCOLES: 'Miércoles',
  JUEVES: 'Jueves',
  VIERNES: 'Viernes',
  SABADO: 'Sábado',
  DOMINGO: 'Domingo',
};

@Pipe({ name: 'etiqueta' })
export class EtiquetaPipe implements PipeTransform {
  transform(valor: string | null | undefined): string {
    if (!valor) return '';
    return ETIQUETAS[valor] ?? valor;
  }
}

/** "07:30:00" → "07:30" */
@Pipe({ name: 'hora' })
export class HoraPipe implements PipeTransform {
  transform(valor: string | null | undefined): string {
    return valor ? valor.substring(0, 5) : '';
  }
}

/** Etiqueta de color para estados y roles. */
@Component({
  selector: 'app-badge',
  imports: [EtiquetaPipe],
  template: `<span class="badge" [class]="'badge b-' + valor()">{{ valor() | etiqueta }}</span>`,
})
export class Badge {
  valor = input.required<string>();
}

/** Ventana modal con título y contenido proyectado. */
@Component({
  selector: 'app-modal',
  imports: [DialogoAccesible],
  template: `
    <div class="modal-fondo" (click)="cerrar.emit()">
      <div class="modal" [class.modal-lg]="ancho()" role="dialog" aria-modal="true" [attr.aria-labelledby]="idTitulo"
           dialogoAccesible (escape)="cerrar.emit()" (click)="$event.stopPropagation()">
        <div class="modal-cab">
          <h2 class="modal-titulo" [id]="idTitulo">{{ titulo() }}</h2>
          <button type="button" class="btn-icono" (click)="cerrar.emit()" aria-label="Cerrar">×</button>
        </div>
        <ng-content />
      </div>
    </div>
  `,
})
export class Modal {
  titulo = input.required<string>();
  ancho = input(false);
  cerrar = output<void>();
  private static n = 0;
  protected idTitulo = `modal-titulo-${++Modal.n}`;
}

/** Estado de carga, error o lista vacía. */
@Component({
  selector: 'app-estado',
  template: `
    @if (cargando()) {
      <div class="estado" role="status"><span class="spinner" aria-hidden="true"></span> Cargando…</div>
    } @else if (error()) {
      <div class="estado estado-error" role="alert">
        <strong>No se pudo cargar la información.</strong><br />{{ error() }}
      </div>
    } @else if (vacio()) {
      <div class="estado">{{ textoVacio() }}</div>
    }
  `,
})
export class Estado {
  cargando = input(false);
  error = input<string | null>(null);
  vacio = input(false);
  textoVacio = input('No hay registros para mostrar.');
}
