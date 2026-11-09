import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginResponse, Mensaje, RegistroRequest, RegistroResponse, Rol, Usuario } from '../models';

const CLAVE_SESION = 'powerfit.sesion';

interface Sesion {
  token: string;
  expiraEn: number; // milisegundos (Date.now())
  usuario: Usuario;
}

/** Login, registro y estado de la sesión (token JWT + usuario) guardado en localStorage. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private url = `${environment.apiUrl}/auth`;

  private sesion = signal<Sesion | null>(this.leerSesion());

  readonly usuario = computed(() => this.sesion()?.usuario ?? null);
  readonly rol = computed<Rol | null>(() => this.sesion()?.usuario.rol ?? null);
  readonly autenticado = computed(() => this.sesion() !== null);

  private temporizador?: ReturnType<typeof setTimeout>;

  constructor() {
    this.programarCierre();
  }

  get token(): string | null {
    const s = this.sesion();
    if (!s) return null;
    if (Date.now() >= s.expiraEn) {
      this.logout(true);
      return null;
    }
    return s.token;
  }

  tieneRol(...roles: Rol[]): boolean {
    const r = this.rol();
    return r !== null && roles.includes(r);
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.url}/login`, { email, password }).pipe(
      tap((r) => {
        const sesion: Sesion = {
          token: r.token,
          expiraEn: Date.now() + r.expiraEnSegundos * 1000,
          usuario: r.usuario,
        };
        localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
        this.sesion.set(sesion);
        this.programarCierre();
      }),
    );
  }

  registrar(datos: RegistroRequest): Observable<RegistroResponse> {
    return this.http.post<RegistroResponse>(`${this.url}/registro`, datos);
  }

  verificarCodigo(email: string, codigo: string): Observable<Mensaje> {
    return this.http.post<Mensaje>(`${this.url}/verificar`, { email, codigo });
  }

  reenviarCodigo(email: string): Observable<Mensaje> {
    return this.http.post<Mensaje>(`${this.url}/reenviar-codigo`, { email });
  }

  perfil(): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.url}/perfil`).pipe(
      tap((usuario) => {
        const s = this.sesion();
        if (s) {
          const nueva = { ...s, usuario };
          localStorage.setItem(CLAVE_SESION, JSON.stringify(nueva));
          this.sesion.set(nueva);
        }
      }),
    );
  }

  /**
   * Cerrar sesión lleva a la página principal.
   * @param expirada true si se cierra porque el token venció: va al login con el aviso.
   */
  logout(expirada = false): void {
    clearTimeout(this.temporizador);
    localStorage.removeItem(CLAVE_SESION);
    this.sesion.set(null);
    if (expirada) {
      this.router.navigate(['/login'], { queryParams: { expirada: 1 } });
    } else {
      this.router.navigate(['/']);
    }
  }

  private programarCierre(): void {
    clearTimeout(this.temporizador);
    const s = this.sesion();
    if (s) {
      this.temporizador = setTimeout(() => this.logout(true), Math.max(s.expiraEn - Date.now(), 0));
    }
  }

  private leerSesion(): Sesion | null {
    try {
      const texto = localStorage.getItem(CLAVE_SESION);
      if (!texto) return null;
      const s = JSON.parse(texto) as Sesion;
      return s.expiraEn > Date.now() ? s : null;
    } catch {
      return null;
    }
  }
}
