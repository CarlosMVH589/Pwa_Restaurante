import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { OrderStatus, RestaurantOrder } from '../../../../core/orders/order.model';
import { RealtimeOrdersService } from '../../../../core/orders/realtime-orders.service';

@Component({
  selector: 'app-cocina',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cocina.component.html',
  styleUrls: ['./cocina.component.css']
})
export class CocinaPage implements OnInit {
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

  get menuItems() {
    return this.realtime.menuItems();
  }

  toggleDisponibilidad(item: { nombre: string; disponible: boolean }): void {
    this.realtime.cambiarDisponibilidad(item.nombre, !item.disponible);
  }

  getOrdenesPorEstado(estado: OrderStatus): RestaurantOrder[] {
    return this.realtime.ordenes().filter((orden) => orden.estado === estado);
  }

  avanzarEstado(orden: RestaurantOrder): void {
    const next: Partial<Record<OrderStatus, OrderStatus>> = {
      pendiente: 'preparacion',
      preparacion: 'listo',
    };
    const estado = next[orden.estado];
    if (estado) this.realtime.cambiarEstadoOrden(orden.id, estado);
  }

  retrocederEstado(orden: RestaurantOrder): void {
    const previous: Partial<Record<OrderStatus, OrderStatus>> = {
      preparacion: 'pendiente',
      listo: 'preparacion',
    };
    const estado = previous[orden.estado];
    if (estado) this.realtime.cambiarEstadoOrden(orden.id, estado);
  }
}