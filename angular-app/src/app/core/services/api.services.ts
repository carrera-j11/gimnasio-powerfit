import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import {
  Clase, ClaseRequest, Entrenador, EntrenadorUpdateRequest, EstadoCuenta, Inscripcion, InscripcionRequest,
  Membresia, MembresiaRequest, MembresiaUpdateRequest, Pago, PagoRequest, Plan, PlanUpdateRequest,
  RevisionRequest, Rol, Socio, SocioUpdateRequest, TipoPlan, Usuario, UsuarioCrearRequest,
} from '../models';

const API = environment.apiUrl;

/** /api/admin/usuarios (solo ADMIN) */
@Injectable({ providedIn: 'root' })
export class UsuarioAdminService {
  private http = inject(HttpClient);
  private url = `${API}/admin/usuarios`;

  listar(estado?: EstadoCuenta | '', rol?: Rol | '') {
    let params = new HttpParams();
    if (estado) params = params.set('estado', estado);
    if (rol) params = params.set('rol', rol);
    return this.http.get<Usuario[]>(this.url, { params });
  }
  pendientes() { return this.http.get<Usuario[]>(`${this.url}/pendientes`); }
  personal() { return this.http.get<Usuario[]>(`${this.url}/personal`); }
  buscar(id: number) { return this.http.get<Usuario>(`${this.url}/${id}`); }
  crear(dto: UsuarioCrearRequest) { return this.http.post<Usuario>(this.url, dto); }
  revisar(id: number, dto: RevisionRequest) { return this.http.put<Usuario>(`${this.url}/${id}/revision`, dto); }
  eliminar(id: number) { return this.http.delete<void>(`${this.url}/${id}`); }
}

/** /api/planes */
@Injectable({ providedIn: 'root' })
export class PlanService {
  private http = inject(HttpClient);
  private url = `${API}/planes`;

  listar() { return this.http.get<Plan[]>(this.url); }
  buscar(tipo: TipoPlan) { return this.http.get<Plan>(`${this.url}/${tipo}`); }
  actualizar(tipo: TipoPlan, dto: PlanUpdateRequest) { return this.http.put<Plan>(`${this.url}/${tipo}`, dto); }
}

/** /api/socios */
@Injectable({ providedIn: 'root' })
export class SocioService {
  private http = inject(HttpClient);
  private url = `${API}/socios`;

  listar() { return this.http.get<Socio[]>(this.url); }
  me() { return this.http.get<Socio>(`${this.url}/me`); }
  buscarPorCedula(cedula: string) { return this.http.get<Socio>(`${this.url}/cedula/${cedula}`); }
  buscar(id: number) { return this.http.get<Socio>(`${this.url}/${id}`); }
  actualizar(id: number, dto: SocioUpdateRequest) { return this.http.put<Socio>(`${this.url}/${id}`, dto); }
  eliminar(id: number) { return this.http.delete<void>(`${this.url}/${id}`); }
}

/** /api/entrenadores */
@Injectable({ providedIn: 'root' })
export class EntrenadorService {
  private http = inject(HttpClient);
  private url = `${API}/entrenadores`;

  listar() { return this.http.get<Entrenador[]>(this.url); }
  me() { return this.http.get<Entrenador>(`${this.url}/me`); }
  buscar(id: number) { return this.http.get<Entrenador>(`${this.url}/${id}`); }
  actualizar(id: number, dto: EntrenadorUpdateRequest) { return this.http.put<Entrenador>(`${this.url}/${id}`, dto); }
  eliminar(id: number) { return this.http.delete<void>(`${this.url}/${id}`); }
}

/** /api/membresias */
@Injectable({ providedIn: 'root' })
export class MembresiaService {
  private http = inject(HttpClient);
  private url = `${API}/membresias`;

  listar() { return this.http.get<Membresia[]>(this.url); }
  mias() { return this.http.get<Membresia[]>(`${this.url}/mias`); }
  porSocio(socioId: number) { return this.http.get<Membresia[]>(`${this.url}/socio/${socioId}`); }
  buscar(id: number) { return this.http.get<Membresia>(`${this.url}/${id}`); }
  crear(dto: MembresiaRequest) { return this.http.post<Membresia>(this.url, dto); }
  /** SOCIO: contrata su propia membresía */
  contratar(dto: MembresiaUpdateRequest) { return this.http.post<Membresia>(`${this.url}/contratar`, dto); }
  actualizar(id: number, dto: MembresiaUpdateRequest) { return this.http.put<Membresia>(`${this.url}/${id}`, dto); }
  cancelar(id: number) { return this.http.patch<Membresia>(`${this.url}/${id}/cancelar`, {}); }
  eliminar(id: number) { return this.http.delete<void>(`${this.url}/${id}`); }
}

/** /api/pagos */
@Injectable({ providedIn: 'root' })
export class PagoService {
  private http = inject(HttpClient);
  private url = `${API}/pagos`;

  listar() { return this.http.get<Pago[]>(this.url); }
  mios() { return this.http.get<Pago[]>(`${this.url}/mios`); }
  porMembresia(membresiaId: number) { return this.http.get<Pago[]>(`${this.url}/membresia/${membresiaId}`); }
  buscar(id: number) { return this.http.get<Pago>(`${this.url}/${id}`); }
  crear(dto: PagoRequest) { return this.http.post<Pago>(this.url, dto); }
  /** SOCIO: paga en línea su propia membresía (TARJETA o TRANSFERENCIA) */
  pagar(dto: PagoRequest) { return this.http.post<Pago>(`${this.url}/pagar`, dto); }
  actualizar(id: number, dto: PagoRequest) { return this.http.put<Pago>(`${this.url}/${id}`, dto); }
  eliminar(id: number) { return this.http.delete<void>(`${this.url}/${id}`); }
}

/** /api/clases */
@Injectable({ providedIn: 'root' })
export class ClaseService {
  private http = inject(HttpClient);
  private url = `${API}/clases`;

  listar() { return this.http.get<Clase[]>(this.url); }
  mias() { return this.http.get<Clase[]>(`${this.url}/mias`); }
  buscar(id: number) { return this.http.get<Clase>(`${this.url}/${id}`); }
  inscritos(id: number) { return this.http.get<Inscripcion[]>(`${this.url}/${id}/inscritos`); }
  crear(dto: ClaseRequest) { return this.http.post<Clase>(this.url, dto); }
  actualizar(id: number, dto: ClaseRequest) { return this.http.put<Clase>(`${this.url}/${id}`, dto); }
  eliminar(id: number) { return this.http.delete<void>(`${this.url}/${id}`); }
}

/** /api/inscripciones */
@Injectable({ providedIn: 'root' })
export class InscripcionService {
  private http = inject(HttpClient);
  private url = `${API}/inscripciones`;

  listar() { return this.http.get<Inscripcion[]>(this.url); }
  mias() { return this.http.get<Inscripcion[]>(`${this.url}/mias`); }
  crear(dto: InscripcionRequest) { return this.http.post<Inscripcion>(this.url, dto); }
  eliminar(id: number) { return this.http.delete<void>(`${this.url}/${id}`); }
}
