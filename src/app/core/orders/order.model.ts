export type OrderStatus = 'pendiente' | 'preparacion' | 'listo' | 'entregado';
export type TableStatus = 'disponible' | 'preparando' | 'lista' | 'entregada' | 'cuenta' | 'demora' | 'limpieza';
export type TableZone = 'central' | 'privados' | 'gabinetes' | 'barra';

export interface RestaurantOrder {
  id: string;
  comanda: string;
  mesaId: number;
  mesa: string;
  platillo: string;
  detalle: string;
  cantidad: number;
  precio: number;
  estado: OrderStatus;
  horaSolicitud: string;
}

export interface RestaurantTable {
  id: number;
  nombre: string;
  zona: TableZone;
  estado: TableStatus;
  capacidad: number;
  progreso: number;
  nota?: string;
  limpiezaInicio?: string;
}

export interface MenuItem {
  nombre: string;
  precio: number;
  disponible: boolean;
  categoria: 'platillo' | 'bebida';
}

export interface RestaurantData {
  restaurante: {
    nombre: string;
    ciudad: string;
    estado: string;
    pais: 'MX';
    locale: 'es-MX';
    moneda: 'MXN';
    zonaHoraria: 'America/Mexico_City';
  };
  menuItems: MenuItem[];
  mesas: RestaurantTable[];
  ordenes: RestaurantOrder[];
  cuentasPendientes: RestaurantOrder[];
}