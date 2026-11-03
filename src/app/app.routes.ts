import { Routes } from '@angular/router'; 
import { LoginPage } from './features/auth/pages/login/login'; 
import { CajeroPage } from './features/cajero/cajero'; 
import { CocinaPage } from './features/cocina/pages/cocina/cocina'; 
import { GerenteComponent } from './features/gerente/gerente'; 
import { HostPage } from './features/host/pages/host/host'; 
import { MeseroPage } from './features/mesero/pages/mesero/mesero'; 
import { roleGuard } from './core/auth/role.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginPage },

  // Ruta principal de Gerente 
  { path: 'gerente', component: GerenteComponent, canActivate: [roleGuard], data: { roles: ['gerente'] } },
  // Submódulos de Gerente (Carga perezosa / Lazy loading) 
  { 
    path: 'gerente/gestionar-menu', 
    canActivate: [roleGuard], data: { roles: ['gerente'] },
    loadComponent: () => 
      import('./features/gerente/gestionar-menu/gestionar-menu').then( 
        (m) => m.GestionarMenuComponent 
      ) 
  }, 
  { 
    path: 'gerente/reportes-ventas', 
    canActivate: [roleGuard], data: { roles: ['gerente'] },
    loadComponent: () => 
      import('./features/gerente/reportes-ventas/reportes-ventas').then( 
        (m) => m.ReportesVentasComponent 
      ) 
  }, 
  { 
    path: 'gerente/configuracion-turnos', 
    canActivate: [roleGuard], data: { roles: ['gerente'] },
    loadComponent: () => 
      import('./features/gerente/configuracion-turnos/configuracion-turnos').then( 
        (m) => m.ConfiguracionTurnosComponent 
      ) 
  }, 
  { 
    path: 'gerente/validar-arqueo', 
    canActivate: [roleGuard], data: { roles: ['gerente'] },
    loadComponent: () => 
      import('./features/gerente/validar-arqueo/validar-arqueo').then(
        (m) => m.ValidarArqueoComponent 
      ) 
  }, 
  { 
    path: 'gerente/anadir-personal', 
    canActivate: [roleGuard], data: { roles: ['gerente'] },
    loadComponent: () => 
      import('./features/gerente/anadir-personal/anadir-personal').then( 
        (m) => m.AnadirPersonalComponent 
      ) 
  }, 

  // Ruta principal de Cajero
  { path: 'cajero', component: CajeroPage, canActivate: [roleGuard], data: { roles: ['cajero'] } },
  // Submódulos de Cajero (Carga perezosa / Lazy loading)
  { 
    path: 'cajero/cobro-comanda', 
    canActivate: [roleGuard], data: { roles: ['cajero'] },
    loadComponent: () => 
      import('./features/cajero/cobro-comanda/cobro-comanda').then( 
        (m) => m.CobroComandaComponent 
      ) 
  },
  { 
    path: 'cajero/mapa-mesas', 
    canActivate: [roleGuard], data: { roles: ['cajero'] },
    loadComponent: () => 
      import('./features/cajero/mapa-mesas/mapa-mesas').then( 
        (m) => m.MapaMesasComponent 
      ) 
  },
  { 
    path: 'cajero/corte-caja', 
    canActivate: [roleGuard], data: { roles: ['cajero'] },
    loadComponent: () => 
      import('./features/cajero/corte-caja/corte-caja').then( 
        (m) => m.CorteCajaComponent 
      ) 
  },

  // Rutas de los demás roles del equipo 
  { path: 'mesero', component: MeseroPage, canActivate: [roleGuard], data: { roles: ['mesero'] } },
  { path: 'cocina', component: CocinaPage, canActivate: [roleGuard], data: { roles: ['cocina'] } },
  { path: 'host', component: HostPage, canActivate: [roleGuard], data: { roles: ['host'] } },
  
  // Redirección por defecto ante rutas desconocidas 
  { path: '**', redirectTo: 'login' } 
];