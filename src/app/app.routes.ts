import { Routes } from '@angular/router';
import { LoginPage } from './features/auth/pages/login/login';
import { CajeroPage } from './features/cajero/pages/cajero/cajero';
import { CocinaPage } from './features/cocina/pages/cocina/cocina';
import { GerentePage } from './features/gerente/pages/gerente/gerente';
import { HostPage } from './features/host/pages/host/host';
import { MeseroPage } from './features/mesero/pages/mesero/mesero';

export const routes: Routes = [
	{ path: '', pathMatch: 'full', redirectTo: 'login' },
	{ path: 'login', component: LoginPage },
	{ path: 'gerente', component: GerentePage },
	{ path: 'mesero', component: MeseroPage },
	{ path: 'cocina', component: CocinaPage },
	{ path: 'host', component: HostPage },
	{ path: 'cajero', component: CajeroPage },
	{ path: '**', redirectTo: 'login' },
];
