import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { RestaurantOrder, RestaurantTable } from '../../core/orders/order.model';
import { RealtimeOrdersService } from '../../core/orders/realtime-orders.service';

interface Venta {
  mesa: string;
  comanda: string;
  total: number;
  hora: string;
}

@Component({
  selector: 'app-cajero',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cajero.html',
  styleUrls: ['./cajero.scss'],
})
export class CajeroPage implements OnInit {
  constructor(
    readonly realtime: RealtimeOrdersService,
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  mesaSeleccionada: RestaurantTable | null = null;
  modal: 'dividir' | 'descuento' | 'ventas' | null = null;
  desgloseAbierto: number | null = null;
  partes = 2;
  descuento = 0;
  ventas: Venta[] = [];
  fondoInicial = 1500;
  efectivoVentas = 4850;
  efectivoCapturado = 6350;

  ngOnInit(): void {
    this.realtime.conectar();
  }

  get mesasConCuenta(): RestaurantTable[] {
    return this.realtime.mesas().filter((mesa) => mesa.estado === 'cuenta');
  }

  get ordenesMesa(): RestaurantOrder[] {
    return this.mesaSeleccionada ? this.ordenesDe(this.mesaSeleccionada) : [];
  }

  private ordenesDe(mesa: RestaurantTable): RestaurantOrder[] {
    return [...this.realtime.cuentasPendientes(), ...this.realtime.ordenes()]
      .filter((order) => order.mesaId === mesa.id);
  }

  lineasDe(mesa: RestaurantTable): RestaurantOrder[] {
    return this.ordenesDe(mesa);
  }

  articulosDe(mesa: RestaurantTable): number {
    return this.ordenesDe(mesa).reduce((total, order) => total + order.cantidad, 0);
  }

  descuentoPct(mesa: RestaurantTable): number {
    return this.mesaSeleccionada?.id === mesa.id ? this.descuento : 0;
  }

  descuentoMontoDe(mesa: RestaurantTable): number {
    return this.montoDe(mesa) * this.descuentoPct(mesa) / 100;
  }

  totalDe(mesa: RestaurantTable): number {
    return this.montoDe(mesa) - this.descuentoMontoDe(mesa);
  }

  alternarDesglose(mesa: RestaurantTable, event: Event): void {
    event.stopPropagation();
    this.mesaSeleccionada = mesa;
    this.desgloseAbierto = this.desgloseAbierto === mesa.id ? null : mesa.id;
  }

  comandaDe(mesa: RestaurantTable): string {
    return this.ordenesDe(mesa)[0]?.comanda ?? '';
  }

  montoDe(mesa: RestaurantTable): number {
    return this.ordenesDe(mesa).reduce((total, order) => total + order.precio, 0);
  }

  get subtotal(): number {
    return this.ordenesMesa.reduce((total, order) => total + order.precio, 0);
  }

  get totalConDescuento(): number {
    return this.subtotal * (1 - this.descuento / 100);
  }

  get totalEsperado(): number {
    return this.fondoInicial + this.efectivoVentas;
  }

  get diferencia(): number {
    return this.efectivoCapturado - this.totalEsperado;
  }

  totalOrdenes(total: number, order: RestaurantOrder): number {
    return total + order.precio;
  }

  seleccionarMesa(mesa: RestaurantTable): void {
    this.mesaSeleccionada = mesa;
  }

  abrirModal(modal: 'dividir' | 'descuento' | 'ventas'): void {
    if (modal !== 'ventas' && !this.mesaSeleccionada) return;
    this.modal = modal;
  }

  cerrarModal(): void {
    this.modal = null;
  }

  procesarPago(): void {
    if (!this.mesaSeleccionada || !this.ordenesMesa.length) return;
    const total = this.totalConDescuento;
    this.ventas.push({
      mesa: this.mesaSeleccionada.nombre,
      comanda: this.ordenesMesa[0].comanda,
      total,
      hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
    });
    this.efectivoVentas += total;
    this.efectivoCapturado += total;
    this.realtime.marcarMesa('cobro', this.mesaSeleccionada.id, this.descuento);
    this.descuento = 0;
    this.mesaSeleccionada = null;
    this.modal = null;
  }

  cerrarSesion(): void {
    this.realtime.cerrarConexion();
    this.auth.cerrarSesion();
    void this.router.navigateByUrl('/login');
  }
}
