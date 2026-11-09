// Interfaces que reflejan los DTO de la API de Spring Boot (paquete dto.request y dto.response)

export type Rol = 'ADMIN' | 'RECEPCIONISTA' | 'ENTRENADOR' | 'SOCIO';
export type EstadoCuenta = 'PENDIENTE_VERIFICACION' | 'PENDIENTE_APROBACION' | 'APROBADA' | 'RECHAZADA';
export type TipoPlan = 'QUINCENAL' | 'MENSUAL' | 'ANUAL';
export type EstadoMembresia = 'ACTIVA' | 'VENCIDA' | 'CANCELADA';
export type MetodoPago = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA';
export type DiaSemana = 'LUNES' | 'MARTES' | 'MIERCOLES' | 'JUEVES' | 'VIERNES' | 'SABADO' | 'DOMINGO';

export const ROLES: Rol[] = ['ADMIN', 'RECEPCIONISTA', 'ENTRENADOR', 'SOCIO'];
export const ESTADOS_CUENTA: EstadoCuenta[] = ['PENDIENTE_VERIFICACION', 'PENDIENTE_APROBACION', 'APROBADA', 'RECHAZADA'];
export const TIPOS_PLAN: TipoPlan[] = ['QUINCENAL', 'MENSUAL', 'ANUAL'];
export const METODOS_PAGO: MetodoPago[] = ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA'];
export const DIAS: DiaSemana[] = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];

// ===== Respuestas =====

export interface Usuario {
  id: number;
  cedula: string;
  nombres: string;
  apellidos: string;
  email: string;
  celular: string;
  fechaNacimiento: string;
  edad: number;
  rol: Rol;
  estado: EstadoCuenta;
  perfilId: number | null;
  motivoRechazo: string | null;
  fechaRegistro: string;
  fechaVerificacion: string | null;
  fechaAprobacion: string | null;
  /** true solo para el administrador principal: el único que aprueba nuevos administradores */
  adminPrincipal: boolean;
}

export interface LoginResponse {
  token: string;
  tipo: string;
  expiraEnSegundos: number;
  usuario: Usuario;
}

export interface RegistroResponse {
  mensaje: string;
  usuarioId: number;
  perfilId: number;
  email: string;
  rolSolicitado: string;
  estado: string;
}

export interface Mensaje {
  mensaje: string;
}

export interface Plan {
  id: number;
  tipo: TipoPlan;
  nombre: string;
  descripcion: string | null;
  precio: number;
  duracionDias: number;
}

export interface Socio {
  id: number;
  usuarioId: number;
  cedula: string;
  nombres: string;
  apellidos: string;
  email: string;
  celular: string;
  fechaNacimiento: string;
  edad: number;
  objetivo: string | null;
  fechaAfiliacion: string;
  estadoCuenta: EstadoCuenta;
  membresiaVigente: boolean;
}

export interface Entrenador {
  id: number;
  usuarioId: number;
  nombres: string;
  apellidos: string;
  email: string;
  celular: string;
  especialidad: string;
  fechaIngreso: string;
  estadoCuenta: EstadoCuenta;
  totalClases: number;
}

export interface Membresia {
  id: number;
  socioId: number;
  socioNombre: string;
  socioCedula: string;
  tipoPlan: TipoPlan;
  planNombre: string;
  precioPlan: number;
  fechaInicio: string;
  fechaFin: string;
  estado: EstadoMembresia;
  totalPagado: number;
  saldoPendiente: number;
}

export interface Pago {
  id: number;
  membresiaId: number;
  socioId: number;
  socioNombre: string;
  planNombre: string;
  monto: number;
  metodoPago: MetodoPago;
  referencia: string | null;
  fechaPago: string;
}

export interface Clase {
  id: number;
  nombre: string;
  descripcion: string | null;
  diaSemana: DiaSemana;
  horaInicio: string;
  horaFin: string;
  horario: string;
  cupoMaximo: number;
  inscritos: number;
  cuposDisponibles: number;
  entrenadorId: number;
  entrenadorNombre: string;
  especialidad: string;
  entrenadorEmail: string;
  entrenadorCelular: string;
}

export interface Inscripcion {
  id: number;
  socioId: number;
  socioNombre: string;
  socioCedula: string;
  claseId: number;
  claseNombre: string;
  entrenadorNombre: string;
  horario: string;
  fechaInscripcion: string;
}

/** Formato de error de la API (ErrorResponse.java). */
export interface ApiError {
  timestamp?: string;
  status: number;
  error?: string;
  mensaje: string;
  ruta?: string;
  errores?: Record<string, string>;
}

// ===== Peticiones =====

export interface RegistroRequest {
  cedula: string;
  nombres: string;
  apellidos: string;
  email: string;
  celular: string;
  fechaNacimiento: string;
  password: string;
  confirmarPassword: string;
  rolSolicitado: Rol;
  especialidad?: string | null;
  objetivo?: string | null;
}

export interface UsuarioCrearRequest {
  cedula: string;
  nombres: string;
  apellidos: string;
  email: string;
  celular: string;
  fechaNacimiento: string;
  password: string;
  rol: Rol;
  especialidad?: string | null;
  objetivo?: string | null;
}

export interface RevisionRequest {
  decision: 1 | 2;
  motivo?: string | null;
}

export interface SocioUpdateRequest {
  nombres: string;
  apellidos: string;
  celular: string;
  objetivo?: string | null;
}

export interface EntrenadorUpdateRequest {
  nombres: string;
  apellidos: string;
  celular: string;
  especialidad: string;
}

export interface PlanUpdateRequest {
  descripcion?: string | null;
  precio: number;
}

export interface MembresiaRequest {
  socioId: number;
  tipoPlan: TipoPlan;
  fechaInicio?: string | null;
}

export interface MembresiaUpdateRequest {
  tipoPlan: TipoPlan;
  fechaInicio?: string | null;
}

export interface PagoRequest {
  membresiaId: number;
  monto: number;
  metodoPago: MetodoPago;
  referencia?: string | null;
}

export interface ClaseRequest {
  nombre: string;
  descripcion?: string | null;
  diaSemana: DiaSemana;
  horaInicio: string;
  horaFin: string;
  cupoMaximo: number;
  entrenadorId?: number | null;
}

export interface InscripcionRequest {
  claseId: number;
  socioId?: number | null;
}
