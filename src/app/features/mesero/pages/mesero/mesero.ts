import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { MenuItem, OrderStatus, RestaurantTable, TableStatus, TableZone } from '../../../../core/orders/order.model';
import { RealtimeOrdersService } from '../../../../core/orders/realtime-orders.service';

type AccionCritica = 'entrega' | 'cuenta';

interface Platillo {
  nombre: string;
  detalle: string;
  estado: 'listo' | 'preparando' | 'pendiente' | 'entregado';
}

interface PedidoExtra {
  item: MenuItem;
  cantidad: number;
  detalle: string;
}

@Component({
  selector: 'app-mesero',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mesero.html',
  styleUrl: './mesero.scss',
})
export class MeseroPage implements OnInit, OnDestroy {
  private limpiezaTimer?: ReturnType<typeof setInterval>;
  private readonly limpiezaTick = signal(0);
  constructor(
    readonly realtime: RealtimeOrdersService,
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.realtime.conectar();
    this.limpiezaTimer = setInterval(() => this.limpiezaTick.update((value) => value + 1), 1000);
  }

  ngOnDestroy(): void {
    if (this.limpiezaTimer) clearInterval(this.limpiezaTimer);
  }

  regresar(): void {
    this.realtime.cerrarConexion();
    this.auth.cerrarSesion();
    void this.router.navigateByUrl('/login');
  }

  private mesaSeleccionadaId = 7;
  accionPendiente: AccionCritica | null = null;
  aviso = '';
  pedidoExtraAbierto = false;
  categoriaExtra: MenuItem['categoria'] = 'platillo';
  itemExtraSeleccionado: MenuItem | null = null;
  cantidadExtra = 1;
  detalleExtra = '';
  pedidoExtra: PedidoExtra[] = [];

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

  get mesaEnLimpieza(): boolean {
    return this.mesaSeleccionada.estado === 'limpieza';
  }

  get limpiezaIniciada(): boolean {
    return Boolean(this.mesaSeleccionada.limpiezaInicio);
  }

  get limpiezaTranscurrida(): string {
    this.limpiezaTick();
    if (!this.mesaSeleccionada.limpiezaInicio) return '00:00';
    const segundos = Math.max(0, Math.floor((Date.now() - Date.parse(this.mesaSeleccionada.limpiezaInicio)) / 1000));
    return `${String(Math.floor(segundos / 60)).padStart(2, '0')}:${String(segundos % 60).padStart(2, '0')}`;
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

  get menuDisponible(): MenuItem[] {
    return this.realtime.menuItems().filter((item) => item.disponible && item.categoria === this.categoriaExtra);
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
    if (this.mesaEnLimpieza) return;
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
        this.realtime.confirmarEntregaCompleta(this.mesaSeleccionadaId);
        this.aviso = `Entrega registrada para ${this.mesaSeleccionada.nombre}.`;
      }
    } else if (this.accionPendiente === 'cuenta') {
      if (this.realtime.conexion() !== 'conectado') {
        this.aviso = 'No hay conexión. No se pudo solicitar la cuenta.';
        this.accionPendiente = null;
        return;
      }
      this.realtime.marcarMesa('cuenta', this.mesaSeleccionadaId);
      this.aviso = `Cuenta solicitada para mesa ${this.mesaSeleccionada.id}.`;
    }
    this.accionPendiente = null;
  }

  agregarPedido(): void {
    if (this.mesaEnLimpieza) return;
    this.pedidoExtraAbierto = true;
    this.aviso = '';
    this.seleccionarCategoriaExtra('platillo');
  }

  cerrarPedidoExtra(): void {
    this.pedidoExtraAbierto = false;
    this.itemExtraSeleccionado = null;
    this.cantidadExtra = 1;
    this.detalleExtra = '';
    this.pedidoExtra = [];
  }

  seleccionarCategoriaExtra(categoria: MenuItem['categoria']): void {
    this.categoriaExtra = categoria;
    this.itemExtraSeleccionado = null;
    this.cantidadExtra = 1;
    this.detalleExtra = '';
  }

  seleccionarItemExtra(item: MenuItem): void {
    this.itemExtraSeleccionado = item;
    this.cantidadExtra = 1;
    this.detalleExtra = '';
  }

  agregarLineaExtra(): void {
    if (!this.itemExtraSeleccionado || this.cantidadExtra < 1 || this.cantidadExtra > 20) return;
    const existente = this.pedidoExtra.find((linea) => linea.item.nombre === this.itemExtraSeleccionado?.nombre && linea.detalle === this.detalleExtra.trim());
    if (existente) {
      existente.cantidad += this.cantidadExtra;
    } else {
      this.pedidoExtra.push({
        item: this.itemExtraSeleccionado,
        cantidad: this.cantidadExtra,
        detalle: this.detalleExtra.trim(),
      });
    }
    this.itemExtraSeleccionado = null;
    this.cantidadExtra = 1;
    this.detalleExtra = '';
  }

  quitarLineaExtra(linea: PedidoExtra): void {
    const index = this.pedidoExtra.indexOf(linea);
    if (index >= 0) this.pedidoExtra.splice(index, 1);
  }

  enviarPedidoExtra(): void {
    if (!this.pedidoExtra.length || this.mesaEnLimpieza) return;
    if (this.realtime.conexion() !== 'conectado') {
      this.aviso = 'No hay conexión con cocina. Intenta de nuevo cuando se restablezca.';
      return;
    }

    this.pedidoExtra.forEach((linea) => this.realtime.agregarOrden(
      linea.item,
      this.mesaSeleccionada.id,
      this.mesaSeleccionada.nombre,
      linea.cantidad,
      linea.detalle,
    ));
    this.aviso = `Pedido extra enviado a cocina para ${this.mesaSeleccionada.nombre}.`;
    this.cerrarPedidoExtra();
  }

  iniciarLimpieza(): void {
    if (!this.mesaEnLimpieza || this.limpiezaIniciada) return;
    this.realtime.iniciarLimpieza(this.mesaSeleccionada.id);
  }

  finalizarLimpieza(): void {
    if (!this.mesaEnLimpieza || !this.limpiezaIniciada) return;
    this.realtime.finalizarLimpieza(this.mesaSeleccionada.id);
  }

  totalPedidoExtra(total: number, linea: PedidoExtra): number {
    return total + linea.item.precio * linea.cantidad;
  }

  etiquetaEstado(estado: TableStatus): string {
    return {
      disponible: 'Disponible',
      preparando: 'En preparación',
      lista: 'Lista en cocina',
      entregada: 'Entregada',
      demora: 'Demora',
      limpieza: 'Limpieza',
      cuenta: 'Cuenta solicitada',
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
