import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { OrderStatus, RestaurantTable, TableStatus, TableZone } from '../../../../core/orders/order.model';
import { RealtimeOrdersService } from '../../../../core/orders/realtime-orders.service';

type AccionCritica = 'entrega' | 'cuenta';

interface Platillo {
  nombre: string;
  detalle: string;
  estado: 'listo' | 'preparando' | 'pendiente' | 'entregado';
}

@Component({
  selector: 'app-mesero',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mesero.html',
  styleUrl: './mesero.scss',
})
export class MeseroPage implements OnInit {
  constructor(
    readonly realtime: RealtimeOrdersService,
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.realtime.conectar();
  }

  regresar(): void {
    this.realtime.cerrarConexion();
    this.auth.cerrarSesion();
    void this.router.navigateByUrl('/login');
  }

  private mesaSeleccionadaId = 7;
  accionPendiente: AccionCritica | null = null;
  aviso = '';

  get mesas(): RestaurantTable[] {
    return this.realtime.mesas();
  }

  get mesaSeleccionada(): RestaurantTable {
    return this.mesas.find((mesa) => mesa.id === this.mesaSeleccionadaId) ?? this.mesas[0] ?? {
      id: this.mesaSeleccionadaId,
      nombre: 'Conectando…',
      zona: 'central',
      estado: 'disponible',
      capacidad: 0,
      progreso: 0,
    };
  }

  get platillos(): Platillo[] {
    return this.realtime.ordenes()
      .filter((orden) => orden.mesaId === this.mesaSeleccionadaId)
      .map((orden) => ({
        nombre: orden.cantidad > 1 ? `${orden.cantidad} x ${orden.platillo}` : orden.platillo,
        detalle: orden.detalle,
        estado: this.estadoPlatillo(orden.estado),
      }));
  }

  get mesasEnPreparacion(): number {
    return this.mesas.filter((mesa) => mesa.estado === 'preparando' || mesa.estado === 'lista').length;
  }

  get mesasConDemora(): number {
    return this.mesas.filter((mesa) => mesa.estado === 'demora').length;
  }

  getMesasPorZona(zona: TableZone): RestaurantTable[] {
    return this.mesas.filter((mesa) => mesa.zona === zona);
  }

  etiquetaZona(zona: TableZone): string {
    return { central: 'Salón Central', privados: 'Área Privados', gabinetes: 'Gabinetes', barra: 'Barra' }[zona];
  }

  seleccionarMesa(mesa: RestaurantTable): void {
    this.mesaSeleccionadaId = mesa.id;
    this.aviso = '';
  }

  solicitarConfirmacion(accion: AccionCritica): void {
    this.accionPendiente = accion;
  }

  cerrarConfirmacion(): void {
    this.accionPendiente = null;
  }

  confirmarAccion(): void {
    if (this.accionPendiente === 'entrega') {
      if (this.realtime.conexion() !== 'conectado') {
        this.aviso = 'No hay conexión con cocina. Intenta de nuevo cuando se restablezca.';
        this.accionPendiente = null;
        return;
      }

      const readyOrders = this.realtime.ordenes().filter(
        (orden) => orden.mesaId === this.mesaSeleccionadaId && orden.estado === 'listo',
      );
      if (!readyOrders.length) {
        this.aviso = 'No hay platillos listos para entregar en esta mesa.';
      } else {
        readyOrders.forEach((orden) => this.realtime.cambiarEstadoOrden(orden.id, 'entregado'));
        this.aviso = `Entrega registrada para ${this.mesaSeleccionada.nombre}.`;
      }
    } else if (this.accionPendiente === 'cuenta') {
      this.aviso = `Cuenta solicitada para mesa ${this.mesaSeleccionada.id}.`;
    }
    this.accionPendiente = null;
  }

  agregarPedido(): void {
    this.aviso = `Nuevo pedido agregado a mesa ${this.mesaSeleccionada.id}.`;
  }

  etiquetaEstado(estado: TableStatus): string {
    return {
      disponible: 'Disponible',
      preparando: 'En preparación',
      lista: 'Lista en cocina',
      entregada: 'Entregada',
      demora: 'Demora',
      limpieza: 'Limpieza',
    }[estado];
  }

  platillosListos(): number {
    return this.platillos.filter((platillo) => platillo.estado === 'listo').length;
  }

  private estadoPlatillo(estado: OrderStatus): Platillo['estado'] {
    if (estado === 'pendiente') return 'pendiente';
    if (estado === 'preparacion') return 'preparando';
    return estado;
  }
}
