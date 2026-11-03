import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type UserRole = 'cajero' | 'cocina' | 'gerente' | 'host' | 'mesero';

const demoUsers: Record<UserRole, { password: string; route: string }> = {
  cajero: { password: 'cajero123', route: '/cajero' },
  cocina: { password: 'cocina123', route: '/cocina' },
  gerente: { password: 'gerente123', route: '/gerente' },
  host: { password: 'host123', route: '/host' },
  mesero: { password: 'mesero123', route: '/mesero' },
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);

  get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  get role(): UserRole | null {
    if (!this.isBrowser) return null;
    const role = localStorage.getItem('usuarioActivo');
    return role && role in demoUsers ? role as UserRole : null;
  }

  get token(): string | null {
    return this.isBrowser ? localStorage.getItem('tokenDemo') : null;
  }

  iniciarSesion(username: string, password: string): string | null {
    const role = username.trim().toLowerCase() as UserRole;
    const user = demoUsers[role];
    if (!user || user.password !== password || !this.isBrowser) return null;

    localStorage.setItem('usuarioActivo', role);
    localStorage.setItem('tokenDemo', `demo:${role}`);
    return user.route;
  }

  cerrarSesion(): void {
    if (!this.isBrowser) return;
    localStorage.removeItem('usuarioActivo');
    localStorage.removeItem('tokenDemo');
  }
}