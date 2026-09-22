import { Routes } from '@angular/router'; 
import { LoginPage } from './features/auth/pages/login/login'; 
import { CajeroPage } from './features/cajero/cajero'; 
import { CocinaPage } from './features/cocina/pages/cocina/cocina'; 
import { GerenteComponent } from './features/gerente/gerente'; 
import { HostPage } from './features/host/pages/host/host'; 
import { MeseroPage } from './features/mesero/pages/mesero/mesero'; 

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginPage },
  // Ruta principal de Gerente 
  { path: 'gerente', component: GerenteComponent },
  // Submódulos de Gerente (Carga perezosa / Lazy loading) 
  { path: 'gerente/gestionar-menu', 
    loadComponent: () => 
      import('./features/gerente/gestionar-menu/gestionar-menu').then( 
        (m) => m.GestionarMenuComponent 
      ) 
    }, 
    { 
      path: 'gerente/reportes-ventas', 
      loadComponent: () => 
        import('./features/gerente/reportes-ventas/reportes-ventas').then( 
          (m) => m.ReportesVentasComponent 
        ) 
      }, 
      { 
        path: 'gerente/configuracion-turnos', 
        loadComponent: () => 
          import('./features/gerente/configuracion-turnos/configuracion-turnos').then( 
            (m) => m.ConfiguracionTurnosComponent 
          ) 
        }, 
        { 
          path: 'gerente/validar-arqueo', 
          loadComponent: () => 
            import('./features/gerente/validar-arqueo/validar-arqueo').then(
               (m) => m.ValidarArqueoComponent 
              ) 
            }, 
            { 
              path: 'gerente/anadir-personal', 
              loadComponent: () => 
                import('./features/gerente/anadir-personal/anadir-personal').then( 
                  (m) => m.AnadirPersonalComponent 
                ) 
              }, 
    // Rutas de los demás roles del equipo 
    { path: 'mesero', component: MeseroPage }, 
    { path: 'cocina', component: CocinaPage }, 
    { path: 'host', component: HostPage }, 
    { path: 'cajero', component: CajeroPage }, 
    
    // Redirección por defecto ante rutas desconocidas 
    { path: '**', redirectTo: 'login' } ];