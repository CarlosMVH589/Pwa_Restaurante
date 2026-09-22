import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

type EstadoMesa = 'disponible' | 'preparando' | 'entregada' | 'demora' | 'limpieza';
type AccionCritica = 'entrega' | 'cuenta';
type ZonaMesa = 'central' | 'privados' | 'gabinetes' | 'barra';

interface Mesa {
  id: number;
  nombre: string;
  zona: ZonaMesa;
  estado: EstadoMesa;
  capacidad: number;
  progreso: number;
  nota?: string;
}

interface Platillo {
  nombre: string;
  detalle: string;
  estado: 'listo' | 'preparando' | 'pendiente';
}

@Component({
  selector: 'app-mesero',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mesero.html',
  styleUrl: './mesero.scss',
})
export class MeseroPage {
  mesas: Mesa[] = [
    { id: 1, nombre: 'Gab 1', zona: 'gabinetes', estado: 'entregada', capacidad: 4, progreso: 100 },
    { id: 2, nombre: 'Gab 2', zona: 'gabinetes', estado: 'disponible', capacidad: 4, progreso: 0 },
    { id: 3, nombre: 'Gab 3', zona: 'gabinetes', estado: 'preparando', capacidad: 4, progreso: 66, nota: 'Postre extra' },
    { id: 4, nombre: 'Gab 4', zona: 'gabinetes', estado: 'demora', capacidad: 4, progreso: 50, nota: 'Esperando guarnición' },
    { id: 101, nombre: 'Privado 1', zona: 'privados', estado: 'entregada', capacidad: 6, progreso: 100 },
    { id: 102, nombre: 'Privado 2', zona: 'privados', estado: 'limpieza', capacidad: 6, progreso: 0 },
    { id: 103, nombre: 'Privado 3', zona: 'privados', estado: 'disponible', capacidad: 6, progreso: 0 },
    { id: 5, nombre: 'Mesa 1', zona: 'central', estado: 'disponible', capacidad: 4, progreso: 0 },
    { id: 6, nombre: 'Mesa 2', zona: 'central', estado: 'entregada', capacidad: 4, progreso: 100 },
    { id: 7, nombre: 'Mesa 3', zona: 'central', estado: 'preparando', capacidad: 4, progreso: 33, nota: 'Hamburguesa sin cebolla' },
    { id: 8, nombre: 'Mesa 4', zona: 'central', estado: 'disponible', capacidad: 4, progreso: 0 },
    { id: 9, nombre: 'Mesa 5', zona: 'central', estado: 'limpieza', capacidad: 2, progreso: 0 },
    { id: 10, nombre: 'Mesa 6', zona: 'central', estado: 'disponible', capacidad: 2, progreso: 0 },
    { id: 201, nombre: 'Barra 1', zona: 'barra', estado: 'entregada', capacidad: 1, progreso: 100 },
    { id: 202, nombre: 'Barra 2', zona: 'barra', estado: 'disponible', capacidad: 1, progreso: 0 },
    { id: 203, nombre: 'Barra 3', zona: 'barra', estado: 'preparando', capacidad: 1, progreso: 66 },
  ];

  mesaSeleccionada = this.mesas.find((mesa) => mesa.id === 7)!;
  accionPendiente: AccionCritica | null = null;
  aviso = '';

  platillos: Platillo[] = [
    { nombre: 'Sopa Azteca', detalle: 'Entrada | Sin crema', estado: 'listo' },
    { nombre: 'Hamburguesa BBQ', detalle: 'Fuerte | Termino medio', estado: 'preparando' },
    { nombre: 'Plan Casero', detalle: 'Postre | Banado en cajeta', estado: 'pendiente' },
  ];

  get mesasEnPreparacion(): number {
    return this.mesas.filter((mesa) => mesa.estado === 'preparando').length;
  }

  get mesasConDemora(): number {
    return this.mesas.filter((mesa) => mesa.estado === 'demora').length;
  }

  getMesasPorZona(zona: ZonaMesa): Mesa[] {
    return this.mesas.filter((mesa) => mesa.zona === zona);
  }

  etiquetaZona(zona: ZonaMesa): string {
    return { central: 'Salón Central', privados: 'Área Privados', gabinetes: 'Gabinetes', barra: 'Barra' }[zona];
  }

  seleccionarMesa(mesa: Mesa): void {
    this.mesaSeleccionada = mesa;
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
      this.mesaSeleccionada.estado = 'entregada';
      this.mesaSeleccionada.progreso = 100;
      this.aviso = `Mesa ${this.mesaSeleccionada.id} marcada como entrega completa.`;
    } else if (this.accionPendiente === 'cuenta') {
      this.mesaSeleccionada.estado = 'demora';
      this.aviso = `Cuenta solicitada para mesa ${this.mesaSeleccionada.id}.`;
    }
    this.accionPendiente = null;
  }

  agregarPedido(): void {
    this.aviso = `Nuevo pedido agregado a mesa ${this.mesaSeleccionada.id}.`;
  }

  etiquetaEstado(estado: EstadoMesa): string {
    return {
      disponible: 'Disponible',
      preparando: 'En preparación',
      entregada: 'Entregada',
      demora: 'Demora',
      limpieza: 'Limpieza',
    }[estado];
  }

  platillosListos(): number {
    return this.platillos.filter((platillo) => platillo.estado === 'listo').length;
  }
}

