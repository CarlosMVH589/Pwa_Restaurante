import { isPlatformBrowser } from '@angular/common';
import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { MenuItem, OrderStatus, RestaurantData, TableStatus } from './order.model';

@Injectable({ providedIn: 'root' })
export class RealtimeOrdersService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly auth = inject(AuthService);
  private socket?: WebSocket;
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private closedByUser = false;
  private readonly snapshot = signal<RestaurantData | null>(null);

  readonly ordenes = computed(() => this.snapshot()?.ordenes ?? []);
  readonly cuentasPendientes = computed(() => this.snapshot()?.cuentasPendientes ?? []);
  readonly mesas = computed(() => this.snapshot()?.mesas ?? []);
  readonly menuItems = computed(() => this.snapshot()?.menuItems ?? []);
  readonly conexion = signal<'conectando' | 'conectado' | 'desconectado'>('desconectado');

  constructor() {
    if (isPlatformBrowser(this.platformId)) this.conectar();
  }

  cambiarEstadoOrden(orderId: string, estado: OrderStatus): void {
    this.enviar({ type: 'update-status', orderId, estado });
  }

  marcarMesa(
    accion: 'entrega' | 'cuenta' | 'cobro' | TableStatus,
    mesaId: number,
  ): void {
    this.enviar({ type: 'update-table', accion, mesaId: String(mesaId) });
  }

  iniciarLimpieza(mesaId: number): void {
    this.enviar({ type: 'start-cleaning', mesaId: String(mesaId) });
  }

  finalizarLimpieza(mesaId: number): void {
    this.enviar({ type: 'finish-cleaning', mesaId: String(mesaId) });
  }

  confirmarEntregaCompleta(mesaId: number): void {
    this.enviar({ type: 'complete-delivery', mesaId: String(mesaId) });
  }

  cambiarDisponibilidad(nombre: string, disponible: boolean): void {
    this.enviar({ type: 'update-menu', nombre, disponible });
  }

  agregarOrden(item: MenuItem, mesaId: number, mesa: string, cantidad: number, detalle: string): void {
    this.enviar({
      type: 'add-order',
      nombre: item.nombre,
      mesaId: String(mesaId),
      mesa,
      cantidad: String(cantidad),
      detalle,
    });
  }

  conectar(): void {
    const token = this.auth.token;
    if (!token || !this.auth.role || this.socket?.readyState === WebSocket.OPEN || this.socket?.readyState === WebSocket.CONNECTING) return;

    this.closedByUser = false;
    this.conexion.set('conectando');
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    this.socket = new WebSocket(`${protocol}//${location.host}/ws/ordenes?token=${encodeURIComponent(token)}`);
    this.socket.onopen = () => this.conexion.set('conectado');
    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data as string) as { type: string; data?: RestaurantData };
        if (message.type === 'snapshot' && message.data) this.snapshot.set(message.data);
      } catch {
        this.conexion.set('desconectado');
      }
    };
    this.socket.onerror = () => this.conexion.set('desconectado');
    this.socket.onclose = () => {
      this.conexion.set('desconectado');
      if (this.auth.token && !this.closedByUser && !this.reconnectTimer) {
        this.reconnectTimer = setTimeout(() => {
          this.reconnectTimer = undefined;
          this.conectar();
        }, 2000);
      }
    };
  }

  cerrarConexion(): void {
    this.closedByUser = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = undefined;
    this.socket?.close();
    this.socket = undefined;
    this.conexion.set('desconectado');
  }

  private enviar(message: Record<string, string | boolean>): void {
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify(message));
  }
}