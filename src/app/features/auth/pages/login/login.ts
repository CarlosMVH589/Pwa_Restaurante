import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <main class="login-page">
      <section class="login-panel" aria-labelledby="login-title">
        <div class="brand-mark" aria-hidden="true">RM</div>
        <p class="eyebrow">RESTAURANT MANAGEMENT</p>
        <h1 id="login-title">Bienvenido de nuevo</h1>
        <p class="intro">Ingresa a tu espacio de trabajo operativo.</p>

        <form class="login-form" (ngSubmit)="iniciarSesion()" #loginForm="ngForm">
          <div class="field-group">
            <label for="usuario">Usuario</label>
            <input
              id="usuario"
              name="usuario"
              type="text"
              autocomplete="username"
              placeholder="Escribe tu usuario"
              [(ngModel)]="usuario"
              required
            />
          </div>

          <div class="field-group">
            <div class="field-heading">
              <label for="contrasena">Contraseña</label>
              <span>Acceso seguro</span>
            </div>
            <input
              id="contrasena"
              name="contrasena"
              type="password"
              autocomplete="current-password"
              placeholder="Escribe tu contraseña"
              [(ngModel)]="contrasena"
              required
            />
          </div>

          @if (errorMessage) {
            <p class="error-message" role="alert">{{ errorMessage }}</p>
          }

          <button class="submit-button" type="submit" [disabled]="loginForm.invalid">
            Iniciar sesión <span aria-hidden="true">→</span>
          </button>
        </form>

        <p class="access-note">Tu sesión se abrirá con los permisos correspondientes a tu rol.</p>
      </section>

      <aside class="login-aside" aria-label="Información del restaurante">
        <div class="aside-content">
          <span class="status-dot"></span>
          <p class="aside-label">OPERACIÓN EN TIEMPO REAL</p>
          <h2>Todo el restaurante, en un solo lugar.</h2>
          <p class="aside-copy">Coordina pedidos, mesas, cocina y caja desde una experiencia operativa clara.</p>
        </div>
        <div class="aside-footer">
          <span>RM / 01</span>
          <span>CONTROL OPERATIVO</span>
        </div>
      </aside>
    </main>
  `,
  styles: [`
    :host {
      --ink: #17211f;
      --muted: #6d7773;
      --line: #d9dfdb;
      --paper: #f5f6f1;
      --accent: #d96c45;
      --accent-dark: #aa4d2f;
      display: block;
      min-height: 100vh;
    }

    .login-page {
      min-height: 100vh;
      display: grid;
      grid-template-columns: minmax(360px, 0.9fr) minmax(420px, 1.1fr);
      background: var(--paper);
      color: var(--ink);
      font-family: Georgia, 'Times New Roman', serif;
    }

    .login-panel {
      width: min(100%, 500px);
      align-self: center;
      justify-self: center;
      padding: 48px clamp(28px, 7vw, 88px);
      box-sizing: border-box;
    }

    .brand-mark {
      width: 48px;
      height: 48px;
      display: grid;
      place-items: center;
      margin-bottom: 32px;
      background: var(--ink);
      color: #f7e6ce;
      font-size: 0.9rem;
      font-weight: 700;
      letter-spacing: 0.08em;
    }

    .eyebrow, .aside-label, .aside-footer, .field-heading span {
      font-family: Arial, sans-serif;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .eyebrow {
      margin: 0 0 12px;
      color: var(--accent-dark);
      font-size: 0.68rem;
      font-weight: 700;
    }

    h1, h2, p { margin-top: 0; }

    h1 {
      max-width: 360px;
      margin-bottom: 12px;
      font-size: clamp(2.2rem, 4vw, 3.5rem);
      line-height: 0.98;
      font-weight: 500;
    }

    .intro, .access-note, .field-group, .submit-button {
      font-family: Arial, sans-serif;
    }

    .intro {
      margin-bottom: 38px;
      color: var(--muted);
      font-size: 0.98rem;
      line-height: 1.6;
    }

    .login-form { display: grid; gap: 22px; }
    .field-group { display: grid; gap: 8px; }
    label { font-size: 0.78rem; font-weight: 700; }

    .field-heading {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }

    .field-heading span {
      color: var(--muted);
      font-size: 0.58rem;
    }

    input {
      width: 100%;
      box-sizing: border-box;
      border: 1px solid var(--line);
      border-radius: 0;
      padding: 14px 15px;
      background: rgba(255, 255, 255, 0.55);
      color: var(--ink);
      font: 0.92rem Arial, sans-serif;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    input:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(217, 108, 69, 0.14);
    }

    .submit-button {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border: 0;
      padding: 15px 18px;
      background: var(--ink);
      color: white;
      font-size: 0.86rem;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.2s, transform 0.2s;
    }

    .submit-button:hover:not(:disabled) { background: var(--accent-dark); transform: translateY(-1px); }
    .submit-button:disabled { cursor: not-allowed; opacity: 0.45; }

    .error-message {
      margin: -4px 0 0;
      padding: 10px 12px;
      background: #fce9e3;
      color: #9b3c25;
      font: 0.8rem/1.4 Arial, sans-serif;
    }

    .access-note {
      margin: 22px 0 0;
      color: var(--muted);
      font-size: 0.72rem;
      line-height: 1.5;
    }

    .login-aside {
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 100vh;
      padding: clamp(32px, 7vw, 92px);
      box-sizing: border-box;
      overflow: hidden;
      background: var(--ink);
      color: #f7e6ce;
    }

    .login-aside::after {
      content: '';
      position: absolute;
      right: -100px;
      bottom: 12%;
      width: 420px;
      height: 420px;
      border: 1px solid rgba(247, 230, 206, 0.2);
      border-radius: 50%;
      box-shadow: 0 0 0 42px rgba(247, 230, 206, 0.04), 0 0 0 84px rgba(247, 230, 206, 0.03);
    }

    .aside-content { position: relative; z-index: 1; max-width: 500px; margin-top: auto; margin-bottom: auto; }
    .status-dot { display: block; width: 9px; height: 9px; margin-bottom: 28px; border-radius: 50%; background: #d69a60; box-shadow: 0 0 0 7px rgba(214, 154, 96, 0.14); }
    .aside-label { margin-bottom: 22px; color: #d69a60; font: 700 0.68rem Arial, sans-serif; }
    h2 { max-width: 540px; margin-bottom: 20px; font-size: clamp(2.5rem, 5vw, 5.4rem); line-height: 0.94; font-weight: 400; }
    .aside-copy { max-width: 380px; color: #b8c0b9; font: 0.96rem/1.7 Arial, sans-serif; }
    .aside-footer { position: relative; z-index: 1; display: flex; justify-content: space-between; color: #7f8b84; font: 0.62rem Arial, sans-serif; }

    @media (max-width: 760px) {
      .login-page { display: block; }
      .login-panel { min-height: 100vh; padding: 36px 24px 48px; }
      .login-aside { display: none; }
    }
  `]
})
export class LoginPage {
  usuario = '';
  contrasena = '';
  errorMessage = '';

  private readonly usuarios = {
    cajero: { password: 'cajero123', route: '/cajero' },
    cocina: { password: 'cocina123', route: '/cocina' },
    gerente: { password: 'gerente123', route: '/gerente' },
    host: { password: 'host123', route: '/host' },
    mesero: { password: 'mesero123', route: '/mesero' }
  } as const;

  constructor(private readonly router: Router) {}

  iniciarSesion() {
    const credenciales = this.usuarios[this.usuario.trim().toLowerCase() as keyof typeof this.usuarios];

    if (!credenciales || credenciales.password !== this.contrasena) {
      this.errorMessage = 'Usuario o contraseña incorrectos.';
      return;
    }

    this.errorMessage = '';
    localStorage.setItem('usuarioActivo', this.usuario.trim().toLowerCase());
    void this.router.navigateByUrl(credenciales.route);
  }
}
