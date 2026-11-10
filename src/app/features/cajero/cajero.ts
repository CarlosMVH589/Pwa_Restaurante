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
  partes = 2;
  descuento = 10;
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
    return this.mesaSeleccionada
      ? [...this.realtime.cuentasPendientes(), ...this.realtime.ordenes()]
        .filter((order) => order.mesaId === this.mesaSeleccionada?.id)
      : [];
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
    this.realtime.marcarMesa('cobro', this.mesaSeleccionada.id);
    this.mesaSeleccionada = null;
    this.modal = null;
  }

  cerrarSesion(): void {
    this.realtime.cerrarConexion();
    this.auth.cerrarSesion();
    void this.router.navigateByUrl('/login');
  }
}
