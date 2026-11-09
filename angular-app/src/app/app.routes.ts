import { Routes } from '@angular/router';
import { authGuard, invitadoGuard, rolGuard } from './core/guards';

// RUTAS PUBLICAS: login, registro, reenviar-codigo, inicio
export const routes: Routes = [
  { path: '', title: 'PowerFit', loadComponent: () => import('./features/publico/inicio').then((m) => m.Inicio) },
  {
    path: 'login', title: 'Iniciar sesión · PowerFit', canActivate: [invitadoGuard],
    loadComponent: () => import('./features/publico/login').then((m) => m.Login),
  },
  {
    path: 'registro', title: 'Registro · PowerFit', canActivate: [invitadoGuard],
    loadComponent: () => import('./features/publico/registro').then((m) => m.Registro),
  },
  {
    path: 'verificar-correo', title: 'Verificar correo · PowerFit',
    loadComponent: () => import('./features/publico/verificar-correo').then((m) => m.VerificarCorreo),
  },
  {
    path: 'reenviar-codigo', title: 'Reenviar código · PowerFit',
    loadComponent: () => import('./features/publico/reenviar-codigo').then((m) => m.ReenviarCodigo),
  },
  
// RUTAS PRIVADAS: panel, perfil, admin, socios, membresias, pagos, inscripciones, entrenadores, clases, mis-clases, mi-membresia, mis-inscripciones
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell').then((m) => m.Shell),
    children: [
      { path: 'panel', title: 'Panel · PowerFit', loadComponent: () => import('./features/panel/panel').then((m) => m.Panel) },
      { path: 'perfil', title: 'Mi perfil · PowerFit', loadComponent: () => import('./features/perfil/perfil').then((m) => m.Perfil) },

      // ADMIN
      {
        path: 'admin/solicitudes', title: 'Solicitudes · PowerFit', canActivate: [rolGuard], data: { roles: ['ADMIN'] },
        loadComponent: () => import('./features/admin/solicitudes').then((m) => m.Solicitudes),
      },
      {
        path: 'admin/usuarios', title: 'Usuarios · PowerFit', canActivate: [rolGuard], data: { roles: ['ADMIN'] },
        loadComponent: () => import('./features/admin/usuarios').then((m) => m.Usuarios),
      },
      {
        path: 'admin/planes', title: 'Planes · PowerFit', canActivate: [rolGuard], data: { roles: ['ADMIN'] },
        loadComponent: () => import('./features/admin/planes').then((m) => m.Planes),
      },

      // ADMIN y RECEPCIONISTA
      {
        path: 'socios', title: 'Socios · PowerFit', canActivate: [rolGuard], data: { roles: ['ADMIN', 'RECEPCIONISTA'] },
        loadComponent: () => import('./features/socios/socios').then((m) => m.Socios),
      },
      {
        path: 'socios/:id', title: 'Ficha del socio · PowerFit', canActivate: [rolGuard], data: { roles: ['ADMIN', 'RECEPCIONISTA'] },
        loadComponent: () => import('./features/socios/socio-detalle').then((m) => m.SocioDetalle),
      },
      {
        path: 'membresias', title: 'Membresías · PowerFit', canActivate: [rolGuard], data: { roles: ['ADMIN', 'RECEPCIONISTA'] },
        loadComponent: () => import('./features/membresias/membresias').then((m) => m.Membresias),
      },
      {
        path: 'pagos', title: 'Pagos · PowerFit', canActivate: [rolGuard], data: { roles: ['ADMIN', 'RECEPCIONISTA'] },
        loadComponent: () => import('./features/pagos/pagos').then((m) => m.Pagos),
      },
      {
        path: 'inscripciones', title: 'Inscripciones · PowerFit', canActivate: [rolGuard], data: { roles: ['ADMIN', 'RECEPCIONISTA'] },
        loadComponent: () => import('./features/inscripciones/inscripciones').then((m) => m.Inscripciones),
      },

      // Todos los roles
      {
        path: 'entrenadores', title: 'Entrenadores · PowerFit',
        loadComponent: () => import('./features/entrenadores/entrenadores').then((m) => m.Entrenadores),
      },
      {
        path: 'clases', title: 'Clases · PowerFit',
        loadComponent: () => import('./features/clases/clases').then((m) => m.Clases),
      },
      {
        path: 'clases/:id/inscritos', title: 'Inscritos · PowerFit', canActivate: [rolGuard],
        data: { roles: ['ADMIN', 'RECEPCIONISTA', 'ENTRENADOR'] },
        loadComponent: () => import('./features/clases/inscritos').then((m) => m.Inscritos),
      },

      // ENTRENADOR
      {
        path: 'mis-clases', title: 'Mis clases · PowerFit', canActivate: [rolGuard], data: { roles: ['ENTRENADOR'], mias: true },
        loadComponent: () => import('./features/clases/clases').then((m) => m.Clases),
      },

      // SOCIO
      {
        path: 'mi-membresia', title: 'Mi membresía · PowerFit', canActivate: [rolGuard], data: { roles: ['SOCIO'] },
        loadComponent: () => import('./features/socio/mi-membresia').then((m) => m.MiMembresia),
      },
      {
        path: 'mis-inscripciones', title: 'Mis inscripciones · PowerFit', canActivate: [rolGuard], data: { roles: ['SOCIO'] },
        loadComponent: () => import('./features/socio/mis-inscripciones').then((m) => m.MisInscripciones),
      },

      {
        path: 'acceso-denegado', title: 'Acceso denegado · PowerFit',
        loadComponent: () => import('./features/errores/acceso-denegado').then((m) => m.AccesoDenegado),
      },
    ],
  },

  { path: '**', title: 'Página no encontrada · PowerFit', loadComponent: () => import('./features/errores/no-encontrado').then((m) => m.NoEncontrado) },
];
