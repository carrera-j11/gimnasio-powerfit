import { Component, computed, DestroyRef, ElementRef, HostListener, inject, signal, viewChild } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { Rol } from '../core/models';
import { AuthService } from '../core/services/auth.service';
import { NotificacionService } from '../core/services/notificacion.service';
import { EtiquetaPipe } from '../shared/ui';
import { A11Y } from '../shared/a11y';

interface ItemMenu {
  texto: string;
  ruta: string;
  roles: Rol[];
}

/** Menú lateral: cada opción se muestra solo a los roles que pueden usarla en la API. */
const MENU: ItemMenu[] = [
  { texto: 'Panel', ruta: '/panel', roles: ['ADMIN', 'RECEPCIONISTA', 'ENTRENADOR', 'SOCIO'] },
  { texto: 'Solicitudes', ruta: '/admin/solicitudes', roles: ['ADMIN'] },
  { texto: 'Usuarios', ruta: '/admin/usuarios', roles: ['ADMIN'] },
  { texto: 'Planes', ruta: '/admin/planes', roles: ['ADMIN'] },
  { texto: 'Socios', ruta: '/socios', roles: ['ADMIN', 'RECEPCIONISTA'] },
  { texto: 'Membresías', ruta: '/membresias', roles: ['ADMIN', 'RECEPCIONISTA'] },
  { texto: 'Pagos', ruta: '/pagos', roles: ['ADMIN', 'RECEPCIONISTA'] },
  { texto: 'Inscripciones', ruta: '/inscripciones', roles: ['ADMIN', 'RECEPCIONISTA'] },
  { texto: 'Mis clases', ruta: '/mis-clases', roles: ['ENTRENADOR'] },
  { texto: 'Mi membresía', ruta: '/mi-membresia', roles: ['SOCIO'] },
  { texto: 'Mis inscripciones', ruta: '/mis-inscripciones', roles: ['SOCIO'] },
  { texto: 'Horario de clases', ruta: '/clases', roles: ['ADMIN', 'RECEPCIONISTA', 'ENTRENADOR', 'SOCIO'] },
  { texto: 'Entrenadores', ruta: '/entrenadores', roles: ['ADMIN', 'RECEPCIONISTA', 'ENTRENADOR', 'SOCIO'] },
  { texto: 'Mi perfil', ruta: '/perfil', roles: ['ADMIN', 'RECEPCIONISTA', 'ENTRENADOR', 'SOCIO'] },
];

@Component({
  selector: 'app-shell',
  imports: [...A11Y, RouterOutlet, RouterLink, RouterLinkActive, EtiquetaPipe],
  template: `
    <!-- Enlace para saltar el menú (WCAG 2.4.1 Evitar bloques) -->
    <a class="saltar" href="#contenido" (click)="irAlContenido($event)">Saltar al contenido principal</a>
    <div class="shell" [class.menu-abierto]="menuAbierto()">
      <aside class="lateral" id="menu-lateral" aria-label="Menú principal" #lateral>
        <a routerLink="/panel" class="marca" (click)="menuAbierto.set(false)">
          <span class="disco" aria-hidden="true"></span> POWERFIT
        </a>
        @if (auth.usuario(); as u) {
          <div class="quien">
            <strong>{{ u.nombres }} {{ u.apellidos }}</strong>
            <span class="rol-chip" [class]="'rol-chip rol-' + u.rol">{{ u.adminPrincipal ? 'Administrador principal' : (u.rol | etiqueta) }}</span>
          </div>
        }
        <nav aria-label="Secciones">
          @for (item of menu(); track item.ruta) {
            <a [routerLink]="item.ruta" routerLinkActive="activo" ariaCurrentWhenActive="page" (click)="menuAbierto.set(false)">{{ item.texto }}</a>
          }
        </nav>
        <button type="button" class="salir" (click)="salir()">Cerrar sesión</button>
      </aside>

      <div class="principal">
        <header class="barra-movil">
          <button type="button" class="btn-icono btn-menu" #botonMenu (click)="menuAbierto.set(!menuAbierto())"
                  [attr.aria-label]="menuAbierto() ? 'Cerrar menú' : 'Abrir menú'" aria-controls="menu-lateral"
                  [attr.aria-expanded]="menuAbierto()">{{ menuAbierto() ? '✕' : '☰' }}</button>
          <span class="marca-mini"><span class="disco" aria-hidden="true"></span> POWERFIT</span>
        </header>
        <main class="contenido" id="contenido" tabindex="-1" #principal>
          <router-outlet />
        </main>
      </div>
      <div class="velo" (click)="menuAbierto.set(false)" aria-hidden="true"></div>
    </div>
  `,
})
export class Shell {
  protected auth = inject(AuthService);
  private notif = inject(NotificacionService);
  protected menuAbierto = signal(false);
  private principal = viewChild.required<ElementRef<HTMLElement>>('principal');
  private lateral = viewChild.required<ElementRef<HTMLElement>>('lateral');
  private botonMenu = viewChild.required<ElementRef<HTMLElement>>('botonMenu');
  private router = inject(Router);

  constructor() {
    // Tras cada navegación, el foco va al contenido nuevo: el lector de pantalla
    // anuncia la página y el usuario de teclado no tiene que recorrer el menú otra vez.
    const sub = this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      this.menuAbierto.set(false);
      setTimeout(() => this.principal().nativeElement.focus({ preventScroll: true }));
    });
    // Atajo Alt+Mayús+M (lo emite App como evento personalizado)
    const alAtajo = () => this.atajoMenu();
    window.addEventListener('powerfit:menu', alAtajo);
    inject(DestroyRef).onDestroy(() => {
      sub.unsubscribe();
      window.removeEventListener('powerfit:menu', alAtajo);
    });
  }

  /** Alt+Mayús+M: en móvil abre/cierra el menú; en escritorio lleva el foco al primer enlace del menú. */
  atajoMenu(): void {
    const movil = window.matchMedia('(max-width: 900px)').matches;
    if (movil) this.menuAbierto.set(!this.menuAbierto());
    if (!movil || this.menuAbierto()) setTimeout(() => document.querySelector<HTMLElement>('.lateral nav a')?.focus(), 50);
    else this.botonMenu().nativeElement.focus();
  }

  /** Escape cierra el menú en móvil y devuelve el foco al botón, para que no se pierda al ocultarse el menú. */
  @HostListener('document:keydown.escape')
  cerrarMenu(): void {
    if (!this.menuAbierto()) return;
    this.menuAbierto.set(false);
    this.botonMenu().nativeElement.focus();
  }

  /**
   * Con el menú móvil abierto, Tab recorre el botón ✕ y el menú sin pasar a la página cubierta por el velo.
   * El botón va después del menú en el DOM, así que sin esto Tab saltaría del ✕ al contenido (WCAG 2.4.3).
   */
  @HostListener('document:keydown', ['$event'])
  recorrerMenu(ev: KeyboardEvent): void {
    if (ev.key !== 'Tab' || !this.menuAbierto() || !window.matchMedia('(max-width: 900px)').matches) return;
    const items = [
      this.botonMenu().nativeElement,
      ...this.lateral().nativeElement.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'),
    ];
    const actual = items.indexOf(document.activeElement as HTMLElement);
    if (actual === -1) return; // El foco está en otro sitio (p. ej. un diálogo): no interferir
    ev.preventDefault();
    items[(actual + (ev.shiftKey ? -1 : 1) + items.length) % items.length].focus();
  }

  protected irAlContenido(ev: Event): void {
    ev.preventDefault();
    this.principal().nativeElement.focus();
  }

  protected async salir(): Promise<void> {
    const ok = await this.notif.confirmar('Cerrar sesión', '¿Seguro que quieres salir de PowerFit?', 'Cerrar sesión');
    if (ok) this.auth.logout();
  }
  protected menu = computed(() => {
    const rol = this.auth.rol();
    return MENU.filter((i) => rol !== null && i.roles.includes(rol));
  });
}
