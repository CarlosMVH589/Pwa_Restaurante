import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ItemMenu {
  nombre: string;
  disponible: boolean;
}

interface OrdenKDS {
  id: string;
  platillo: string;
  mesa: string;
  tiempo: string;
  comanda: string;
  estado: 'pendiente' | 'preparacion' | 'listo' | 'entregado';
}

@Component({
  selector: 'app-cocina',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cocina.component.html',
  styleUrls: ['./cocina.component.css']
})
export class CocinaPage {
  menuItems: ItemMenu[] = [
    { nombre: 'Taco de Barbacoa', disponible: true },
    { nombre: 'Sopa Azteca', disponible: true },
    { nombre: 'Ensalada César', disponible: false },
    { nombre: 'Hamburguesa BBQ', disponible: true },
    { nombre: 'Papas Fritas', disponible: true },
    { nombre: 'Flan de la Casa', disponible: false }
  ];

  ordenes: OrdenKDS[] = [
    { id: '1', platillo: 'Hamburguesa BBQ', mesa: 'Mesa 3', tiempo: '21:15 (Hace 5m)', comanda: '#104', estado: 'pendiente' },
    { id: '2', platillo: 'Flan de la Casa', mesa: 'Mesa 1', tiempo: '21:18 (Hace 2m)', comanda: '#105', estado: 'pendiente' },
    { id: '3', platillo: 'Sopa Azteca', mesa: 'Mesa 3', tiempo: '21:10 (Hace 10m)', comanda: '#104', estado: 'preparacion' },
    { id: '4', platillo: 'Ensalada César', mesa: 'Mesa 7', tiempo: '21:05 (Hace 15m)', comanda: '#098', estado: 'preparacion' },
    { id: '5', platillo: 'Taco Barbacoa x2', mesa: 'Mesa 3', tiempo: '21:08 (Hace 12m)', comanda: '#104', estado: 'listo' },
    { id: '6', platillo: 'Agua de Jamaica', mesa: 'Mesa 8', tiempo: '20:50 (Hace 30m)', comanda: '#098', estado: 'entregado' }
  ];

  toggleDisponibilidad(item: ItemMenu) {
    item.disponible = !item.disponible;
  }

  getOrdenesPorEstado(estado: 'pendiente' | 'preparacion' | 'listo' | 'entregado'): OrdenKDS[] {
    return this.ordenes.filter(o => o.estado === estado);
  }

  avanzarEstado(orden: OrdenKDS) {
    if (orden.estado === 'pendiente') orden.estado = 'preparacion';
    else if (orden.estado === 'preparacion') orden.estado = 'listo';
    else if (orden.estado === 'listo') orden.estado = 'entregado';
  }

  retrocederEstado(orden: OrdenKDS) {
    if (orden.estado === 'preparacion') orden.estado = 'pendiente';
    else if (orden.estado === 'listo') orden.estado = 'preparacion';
    else if (orden.estado === 'entregado') orden.estado = 'listo';
  }
}