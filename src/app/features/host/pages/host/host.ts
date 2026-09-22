import { Component } from '@angular/core';
import { CommonModule, Location } from '@angular/common';

interface Mesa {
  id: number;
  nombre: string;
  zona: 'central' | 'privados' | 'gabinetes' | 'barra';
  capacidad: number;
  estado: 'disponible' | 'servicio' | 'preparacion' | 'demorado' | 'limpieza';
  tiempoMinutos?: number;
  sugerida?: boolean;
}

@Component({
  selector: 'app-host',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-wrapper">
      <!-- HEADER -->
      <header class="app-header">
        <button class="btn-regresar" type="button" (click)="regresar()" aria-label="Regresar a la página anterior">← REGRESAR</button>
        <div class="brand">
          <div class="logo-icon">🍽️</div>
          <div>
            <h1>SISTEMA DE GESTIÓN OPERATIVA</h1>
            <p class="subtitle">Dashboard del Host / Anfitrión</p>
          </div>
        </div>
        <div class="user-badge">
          <span class="user-name">Juan Pérez (Host)</span>
          <span class="shift-tag">Turno Matutino</span>
        </div>
      </header>

      <!-- BANNER DE SUGERENCIA MEJORADO (Heurísticas 2 y 8) -->
      <section class="banner-sugerencia">
        <div class="banner-info">
          <div class="star-icon">★</div>
          <div>
            <span class="banner-title">Sugerencia de Asignación</span>
            <p class="banner-desc">
              Mesa recomendada para asignar: <strong>Mesa 3</strong> (Zona Central — Capacidad: 4 personas)
            </p>
          </div>
        </div>
        <button class="btn-sugerida" (click)="resaltarSugerida()">
          🎯 Ver en Plano
        </button>
      </section>

      <!-- ÁREA PRINCIPAL -->
      <div class="main-layout">
        
        <!-- PLANO ARQUITECTÓNICO DEL RESTAURANTE (Heurística 6) -->
        <main class="map-card">
          <div class="card-header">
            <h2>Plano del Restaurante en Tiempo Real</h2>
            <span class="live-indicator"><span class="pulse"></span> En Vivo</span>
          </div>
          
          <!-- CONTENEDOR DEL PLANO FÍSICO -->
          <div class="plano-layout">
            
            <!-- ENTRADA / ACCESO -->
            <div class="zona-acceso">
              <span>🚪 ACCESO PRINCIPAL</span>
            </div>

            <div class="plano-cuerpo">
              
              <!-- COLUMNA IZQUIERDA: PRIVADOS -->
              <div class="sector sector-privados">
                <div class="sector-label">ÁREA PRIVADOS</div>
                <div class="mesas-flex">
                  <ng-container *ngFor="let mesa of getMesasPorZona('privados')">
                    <ng-template *ngTemplateOutlet="mesaTemplate; context: { $implicit: mesa }"></ng-template>
                  </ng-container>
                </div>
              </div>

              <!-- COLUMNA CENTRAL: GABINETES Y ZONA CENTRAL -->
              <div class="sector sector-central">
                <!-- SUBSECCIÓN GABINETES -->
                <div class="sub-sector">
                  <div class="sector-label">GABINETES</div>
                  <div class="mesas-grid-gabinetes">
                    <ng-container *ngFor="let mesa of getMesasPorZona('gabinetes')">
                      <ng-template *ngTemplateOutlet="mesaTemplate; context: { $implicit: mesa }"></ng-template>
                    </ng-container>
                  </div>
                </div>

                <!-- SUBSECCIÓN MESAS DE SALÓN CENTRAL -->
                <div class="sub-sector">
                  <div class="sector-label">SALÓN CENTRAL</div>
                  <div class="mesas-grid-central">
                    <ng-container *ngFor="let mesa of getMesasPorZona('central')">
                      <ng-template *ngTemplateOutlet="mesaTemplate; context: { $implicit: mesa }"></ng-template>
                    </ng-container>
                  </div>
                </div>
              </div>

              <!-- COLUMNA DERECHA: BARRA -->
              <div class="sector sector-barra">
                <div class="sector-label">BARRA</div>
                <div class="barra-curva">
                  <ng-container *ngFor="let mesa of getMesasPorZona('barra')">
                    <ng-template *ngTemplateOutlet="mesaTemplate; context: { $implicit: mesa }"></ng-template>
                  </ng-container>
                </div>
              </div>

            </div>
          </div>

          <!-- TEMPLATE REUTILIZABLE DE MESA -->
          <ng-template #mesaTemplate let-mesa>
            <div 
              class="mesa-item" 
              [ngClass]="[mesa.estado, mesa.sugerida ? 'is-sugerida' : '', mesaSeleccionada?.id === mesa.id ? 'is-selected' : '']"
              (click)="seleccionarMesa(mesa)">
              
              <div class="mesa-header">
                <span class="capacidad-pill">👥 {{ mesa.capacidad }}</span>
                <span *ngIf="mesa.sugerida" class="star-pill">★</span>
              </div>

              <div class="mesa-numero">{{ mesa.id }}</div>
              <div class="mesa-nombre">{{ mesa.nombre }}</div>

              <div class="mesa-footer">
                <span class="badge-status">{{ getEstadoLabel(mesa.estado) }}</span>
                <span *ngIf="mesa.tiempoMinutos" class="badge-time">⏱ {{ mesa.tiempoMinutos }}m</span>
              </div>
            </div>
          </ng-template>

          <!-- LEYENDA CROMÁTICA -->
          <div class="legend-bar">
            <span class="legend-item"><span class="dot disponible"></span> Disponible</span>
            <span class="legend-item"><span class="dot servicio"></span> Servido / Completo</span>
            <span class="legend-item"><span class="dot preparacion"></span> En Preparación</span>
            <span class="legend-item"><span class="dot demorado"></span> Demorado</span>
            <span class="legend-item"><span class="dot limpieza"></span> Limpieza</span>
          </div>
        </main>

        <!-- PANEL LATERAL DE CONTROL -->
        <aside class="panel-card">
          <h3>Panel de Control de Estado</h3>

          <div *ngIf="mesaSeleccionada; else emptyState" class="panel-content">
            <div class="mesa-details">
              <span class="zona-badge">{{ getZonaLabel(mesaSeleccionada.zona) }}</span>
              <h2>{{ mesaSeleccionada.nombre }}</h2>
              <div class="detail-row">
                <span>Capacidad:</span>
                <strong>{{ mesaSeleccionada.capacidad }} Personas</strong>
              </div>
              <div class="detail-row">
                <span>Estado actual:</span>
                <span class="status-pill {{ mesaSeleccionada.estado }}">{{ getEstadoLabel(mesaSeleccionada.estado) }}</span>
              </div>
            </div>

            <!-- ALERTA DE DEMORA (Heurística 9) -->
            <div *ngIf="mesaSeleccionada.estado === 'demorado'" class="alert-box">
              <div class="alert-header">
                <span class="alert-icon">⚠️</span>
                <strong>Alerta por Retraso</strong>
              </div>
              <p>Retraso registrado en Cocina: <strong>+15 min</strong></p>
              <div class="alert-action">💡 Sugerencia: Informar al comensal.</div>
            </div>

            <!-- BOTONES DE CAMBIO DE ESTADO -->
            <div class="actions-list">
              <label class="actions-title">Cambiar Estado a:</label>
              <button class="btn-action disponible" (click)="cambiarEstado('disponible')">
                <span class="indicator-dot"></span> Disponible / Vacía
              </button>
              <button class="btn-action servicio" (click)="cambiarEstado('servicio')">
                <span class="indicator-dot"></span> Servido / Pedido Completo
              </button>
              <button class="btn-action preparacion" (click)="cambiarEstado('preparacion')">
                <span class="indicator-dot"></span> Pedido en Preparación
              </button>
              <button class="btn-action demorado" (click)="cambiarEstado('demorado')">
                <span class="indicator-dot"></span> Demorado / Sin Entrega
              </button>
              <button class="btn-action limpieza" (click)="cambiarEstado('limpieza')">
                <span class="indicator-dot"></span> Limpieza en Proceso
              </button>
            </div>

            <!-- BOTÓN DESHACER (Heurística 3) -->
            <button 
              *ngIf="estadoAnterior" 
              class="btn-undo" 
              (click)="deshacerAccion()">
              ↩️ Deshacer Último Cambio
            </button>
          </div>

          <ng-template #emptyState>
            <div class="empty-container">
              <div class="empty-icon">📍</div>
              <p>Selecciona una mesa en el mapa para gestionar su disponibilidad y estado.</p>
            </div>
          </ng-template>
        </aside>

      </div>
    </div>
  `,
  styles: [`
    :host {
      --primary: #1e293b;
      --accent: #3b82f6;
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --border: #cbd5e1;
      --text: #0f172a;
      --text-muted: #64748b;
      
      --color-disponible: #10b981;
      --color-servicio: #3b82f6;
      --color-preparacion: #f59e0b;
      --color-demorado: #ef4444;
      --color-limpieza: #8b5cf6;
    }

    .dashboard-wrapper {
      padding: 24px;
      background-color: var(--bg);
      min-height: 100vh;
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      color: var(--text);
    }

    /* HEADER */
    .app-header {
      background: var(--primary);
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
      margin-bottom: 20px;
    }
    .btn-regresar { background: transparent; color: white; border: 1px solid #94a3b8; padding: 7px 11px; border-radius: 5px; font-weight: 700; cursor: pointer; }
    .brand { display: flex; align-items: center; gap: 14px; }
    .logo-icon { font-size: 1.8rem; background: rgba(255,255,255,0.1); padding: 8px; border-radius: 10px; }
    .app-header h1 { font-size: 1.15rem; margin: 0; font-weight: 700; }
    .subtitle { font-size: 0.8rem; color: #94a3b8; margin: 2px 0 0 0; }
    .user-badge { text-align: right; }
    .user-name { display: block; font-weight: 600; font-size: 0.9rem; }
    .shift-tag { font-size: 0.75rem; color: #38bdf8; background: rgba(56, 189, 248, 0.1); padding: 2px 8px; border-radius: 12px; }

    /* BANNER */
    .banner-sugerencia {
      background: #fffbeb;
      border: 1px solid #fcd34d;
      padding: 14px 20px;
      border-radius: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .banner-info { display: flex; align-items: center; gap: 14px; }
    .star-icon { background: #f59e0b; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; }
    .banner-title { font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: #b45309; }
    .banner-desc { margin: 2px 0 0 0; font-size: 0.9rem; color: #78350f; }
    .btn-sugerida { background: #d97706; color: white; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 600; font-size: 0.85rem; cursor: pointer; }

    /* GRID PRINCIPAL */
    .main-layout { display: grid; grid-template-columns: 1fr 340px; gap: 24px; }
    .map-card, .panel-card { background: var(--card-bg); border-radius: 12px; border: 1px solid var(--border); padding: 20px; }

    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .live-indicator { font-size: 0.75rem; font-weight: 600; color: #10b981; display: flex; align-items: center; gap: 6px; background: #ecfdf5; padding: 4px 10px; border-radius: 20px; }
    .pulse { width: 8px; height: 8px; background: #10b981; border-radius: 50%; }

    /* PLANO ARQUITECTÓNICO DEL RESTAURANTE */
    .plano-layout {
      border: 3px solid #334155;
      border-radius: 12px;
      background: #f1f5f9;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .zona-acceso {
      background: #e2e8f0;
      border: 2px dashed #94a3b8;
      text-align: center;
      padding: 6px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 0.8rem;
      color: #475569;
    }

    .plano-cuerpo {
      display: grid;
      grid-template-columns: 140px 1fr 140px;
      gap: 16px;
    }

    .sector {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px;
    }

    .sector-label {
      font-size: 0.7rem;
      font-weight: 800;
      color: #64748b;
      text-transform: uppercase;
      margin-bottom: 10px;
      text-align: center;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 4px;
    }

    .mesas-flex { display: flex; flex-direction: column; gap: 12px; }
    .mesas-grid-gabinetes { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
    .mesas-grid-central { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .barra-curva { display: flex; flex-direction: column; gap: 10px; }

    /* ESTILO INDIVIDUAL DE LA MESA */
    .mesa-item {
      background: #ffffff;
      border: 2px solid var(--border);
      border-radius: 10px;
      padding: 8px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      cursor: pointer;
      transition: all 0.2s ease;
      min-height: 85px;
    }
    .mesa-item:hover { transform: translateY(-2px); box-shadow: 0 4px 10px rgba(0,0,0,0.08); }
    .mesa-item.is-selected { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2); }
    .mesa-item.is-sugerida { border-color: #f59e0b; background: #fffdf5; }

    .mesa-header { display: flex; justify-content: space-between; align-items: center; }
    .capacidad-pill { font-size: 0.65rem; color: var(--text-muted); background: #f1f5f9; padding: 2px 4px; border-radius: 4px; font-weight: 600; }
    .star-pill { color: #f59e0b; font-weight: bold; font-size: 0.8rem; }

    .mesa-numero { font-size: 1.5rem; font-weight: 800; text-align: center; color: #1e293b; margin: 2px 0; }
    .mesa-nombre { font-size: 0.7rem; text-align: center; color: var(--text-muted); margin-bottom: 4px; }

    .mesa-footer { display: flex; flex-direction: column; gap: 2px; align-items: center; }
    .badge-status { font-size: 0.6rem; font-weight: 700; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; width: 90%; text-align: center; }

    /* COLORES DE ESTADO */
    .mesa-item.disponible { border-bottom: 4px solid var(--color-disponible); }
    .mesa-item.disponible .badge-status { background: #d1fae5; color: #065f46; }

    .mesa-item.servicio { border-bottom: 4px solid var(--color-servicio); }
    .mesa-item.servicio .badge-status { background: #dbeafe; color: #1e40af; }

    .mesa-item.preparacion { border-bottom: 4px solid var(--color-preparacion); }
    .mesa-item.preparacion .badge-status { background: #fef3c7; color: #92400e; }

    .mesa-item.demorado { border-bottom: 4px solid var(--color-demorado); background: #fef2f2; }
    .mesa-item.demorado .badge-status { background: #fee2e2; color: #991b1b; }

    .mesa-item.limpieza { border-bottom: 4px solid var(--color-limpieza); }
    .mesa-item.limpieza .badge-status { background: #f3e8ff; color: #6b21a8; }

    .badge-time { font-size: 0.65rem; color: #dc2626; font-weight: 700; }

    /* LEYENDA */
    .legend-bar { display: flex; justify-content: space-around; margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--border); }
    .legend-item { font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: center; gap: 6px; }
    .dot { width: 10px; height: 10px; border-radius: 50%; }
    .dot.disponible { background: var(--color-disponible); }
    .dot.servicio { background: var(--color-servicio); }
    .dot.preparacion { background: var(--color-preparacion); }
    .dot.demorado { background: var(--color-demorado); }
    .dot.limpieza { background: var(--color-limpieza); }

    /* PANEL LATERAL */
    .panel-card h3 { font-size: 1.1rem; margin: 0 0 16px 0; }
    .mesa-details { background: #f8fafc; border: 1px solid var(--border); padding: 14px; border-radius: 10px; margin-bottom: 16px; }
    .zona-badge { font-size: 0.7rem; text-transform: uppercase; font-weight: 700; color: var(--accent); background: #eff6ff; padding: 2px 8px; border-radius: 4px; }
    .mesa-details h2 { margin: 6px 0 10px 0; font-size: 1.2rem; }
    .detail-row { display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 6px; color: var(--text-muted); }
    .detail-row strong { color: var(--text); }

    .status-pill { font-weight: 700; padding: 2px 8px; border-radius: 6px; font-size: 0.8rem; }
    .status-pill.disponible { background: #d1fae5; color: #065f46; }
    .status-pill.servicio { background: #dbeafe; color: #1e40af; }
    .status-pill.preparacion { background: #fef3c7; color: #92400e; }
    .status-pill.demorado { background: #fee2e2; color: #991b1b; }
    .status-pill.limpieza { background: #f3e8ff; color: #6b21a8; }

    /* ALERTA DEMORA */
    .alert-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 10px; margin-bottom: 16px; color: #991b1b; font-size: 0.85rem; }
    .alert-header { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
    .alert-action { background: rgba(255,255,255,0.6); padding: 4px 6px; border-radius: 4px; margin-top: 6px; font-size: 0.75rem; font-weight: 600; }

    /* BOTONES */
    .actions-list { display: flex; flex-direction: column; gap: 8px; }
    .actions-title { font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--text-muted); }
    .btn-action { border: 1px solid var(--border); background: white; padding: 10px 12px; border-radius: 8px; font-weight: 600; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 10px; transition: all 0.2s; }
    .btn-action:hover { background: #f1f5f9; }
    .indicator-dot { width: 8px; height: 8px; border-radius: 50%; }
    .btn-action.disponible .indicator-dot { background: var(--color-disponible); }
    .btn-action.servicio .indicator-dot { background: var(--color-servicio); }
    .btn-action.preparacion .indicator-dot { background: var(--color-preparacion); }
    .btn-action.demorado .indicator-dot { background: var(--color-demorado); }
    .btn-action.limpieza .indicator-dot { background: var(--color-limpieza); }

    .btn-undo { width: 100%; margin-top: 16px; background: #334155; color: white; border: none; padding: 12px; border-radius: 8px; font-weight: 600; font-size: 0.85rem; cursor: pointer; }
    .empty-container { text-align: center; padding: 60px 20px; color: var(--text-muted); font-size: 0.9rem; }
    .empty-icon { font-size: 2.5rem; margin-bottom: 12px; }
  `]
})
export class HostPage {
  constructor(private readonly location: Location) {}

  regresar(): void {
    this.location.back();
  }

  mesas: Mesa[] = [
    // Gabinetes superiores
    { id: 1, nombre: 'Gab 1', zona: 'gabinetes', capacidad: 4, estado: 'servicio' },
    { id: 2, nombre: 'Gab 2', zona: 'gabinetes', capacidad: 4, estado: 'disponible' },
    { id: 3, nombre: 'Gab 3', zona: 'gabinetes', capacidad: 4, estado: 'preparacion' },
    { id: 4, nombre: 'Gab 4', zona: 'gabinetes', capacidad: 4, estado: 'demorado', tiempoMinutos: 18 },

    // Área Privados (Izquierda)
    { id: 101, nombre: 'Privado 1', zona: 'privados', capacidad: 6, estado: 'servicio' },
    { id: 102, nombre: 'Privado 2', zona: 'privados', capacidad: 6, estado: 'limpieza' },
    { id: 103, nombre: 'Privado 3', zona: 'privados', capacidad: 6, estado: 'disponible' },

    // Salón Central (Centro)
    { id: 5, nombre: 'Mesa 1', zona: 'central', capacidad: 4, estado: 'disponible' },
    { id: 6, nombre: 'Mesa 2', zona: 'central', capacidad: 4, estado: 'servicio' },
    { id: 7, nombre: 'Mesa 3', zona: 'central', capacidad: 4, estado: 'disponible', sugerida: true },
    { id: 8, nombre: 'Mesa 4', zona: 'central', capacidad: 4, estado: 'disponible' },
    { id: 9, nombre: 'Mesa 5', zona: 'central', capacidad: 2, estado: 'limpieza' },
    { id: 10, nombre: 'Mesa 6', zona: 'central', capacidad: 2, estado: 'disponible' },

    // Barra (Derecha)
    { id: 201, nombre: 'Barra 1', zona: 'barra', capacidad: 1, estado: 'servicio' },
    { id: 202, nombre: 'Barra 2', zona: 'barra', capacidad: 1, estado: 'disponible' },
    { id: 203, nombre: 'Barra 3', zona: 'barra', capacidad: 1, estado: 'preparacion' }
  ];

  mesaSeleccionada: Mesa | null = null;
  estadoAnterior: { mesaId: number; estado: Mesa['estado'] } | null = null;

  getMesasPorZona(zona: Mesa['zona']): Mesa[] {
    return this.mesas.filter(m => m.zona === zona);
  }

  seleccionarMesa(mesa: Mesa) {
    this.mesaSeleccionada = mesa;
  }

  cambiarEstado(nuevoEstado: Mesa['estado']) {
    if (this.mesaSeleccionada) {
      this.estadoAnterior = {
        mesaId: this.mesaSeleccionada.id,
        estado: this.mesaSeleccionada.estado
      };
      this.mesaSeleccionada.estado = nuevoEstado;
    }
  }

  deshacerAccion() {
    if (this.estadoAnterior) {
      const mesa = this.mesas.find(m => m.id === this.estadoAnterior?.mesaId);
      if (mesa) {
        mesa.estado = this.estadoAnterior.estado;
        this.estadoAnterior = null;
      }
    }
  }

  resaltarSugerida() {
    const sugerida = this.mesas.find(m => m.sugerida);
    if (sugerida) {
      this.seleccionarMesa(sugerida);
    }
  }

  getEstadoLabel(estado: Mesa['estado']): string {
    const labels: Record<Mesa['estado'], string> = {
      disponible: 'Disponible',
      servicio: 'En Servicio',
      preparacion: 'Preparación',
      demorado: 'Demorado',
      limpieza: 'En Limpieza'
    };
    return labels[estado];
  }

  getZonaLabel(zona: Mesa['zona']): string {
    const zonas: Record<Mesa['zona'], string> = {
      central: 'Salón Central',
      privados: 'Zona Privados',
      gabinetes: 'Gabinetes',
      barra: 'Barra'
    };
    return zonas[zona];
  }
}