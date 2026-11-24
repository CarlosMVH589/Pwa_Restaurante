import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface ReporteVentas {
  ventasTotales: number;
  ticketPromedio: number;
  transacciones: number;
  top: { posicion: number; nombre: string; monto: number; porcentajeAncho: number }[];
  detalle: { producto: string; categoria: string; unidades: number; total: number }[];
}

export interface RecetaLinea {
  ingredienteId: number;
  nombre?: string;
  unidad?: string;
  cantidad: number;
}

export interface PlatilloMenu {
  id: number;
  nombre: string;
  precio: number;
  seccion: string;
  categoria: 'platillo' | 'bebida';
  disponible: boolean;
  receta: RecetaLinea[];
}

export interface IngredienteStock {
  id: number;
  nombre: string;
  unidad: string;
  stock: number;
}

export interface PlatilloEntrada {
  nombre: string;
  precio: number;
  seccion: string;
  receta: { ingredienteId: number; cantidad: number }[];
}

export function mensajeError(error: unknown): string {
  if (error instanceof HttpErrorResponse) return error.error?.error ?? 'No se pudo conectar con el servidor.';
  return error instanceof Error ? error.message : 'Error inesperado.';
}

@Injectable({ providedIn: 'root' })
export class RestaurantApiService {
  private readonly http = inject(HttpClient);

  menuAdmin(): Promise<PlatilloMenu[]> {
    return firstValueFrom(this.http.get<PlatilloMenu[]>('/api/menu'));
  }

  ingredientes(): Promise<IngredienteStock[]> {
    return firstValueFrom(this.http.get<IngredienteStock[]>('/api/ingredientes'));
  }

  crearPlatillo(platillo: PlatilloEntrada): Promise<{ id: number }> {
    return firstValueFrom(this.http.post<{ id: number }>('/api/menu', platillo));
  }

  actualizarPlatillo(id: number, platillo: PlatilloEntrada): Promise<{ id: number }> {
    return firstValueFrom(this.http.put<{ id: number }>(`/api/menu/${id}`, platillo));
  }

  platilloDisponible(id: number, disponible: boolean): Promise<unknown> {
    return firstValueFrom(this.http.patch(`/api/menu/${id}/disponible`, { disponible }));
  }

  reporteVentas(fecha: string, turno: string): Promise<ReporteVentas> {
    return firstValueFrom(this.http.get<ReporteVentas>('/api/reportes/ventas', { params: { fecha, turno } }));
  }
}
