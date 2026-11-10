import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { WebSocket, WebSocketServer } from 'ws';
import type { OrderStatus, RestaurantData } from './app/core/orders/order.model';
import type { UserRole } from './app/core/auth/auth.service';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();
const restaurantDataPath = [
  join(import.meta.dirname, '../browser/data/restaurante-mx.json'),
  join(process.cwd(), 'public/data/restaurante-mx.json'),
].find(existsSync);
if (!restaurantDataPath) {
  throw new Error('No se encontró public/data/restaurante-mx.json para cargar los datos de demostración.');
}
const restaurantData = JSON.parse(readFileSync(restaurantDataPath, 'utf8')) as RestaurantData;
restaurantData.cuentasPendientes ??= [];
const webSocketServer = new WebSocketServer({ noServer: true });
const socketRoles = new WeakMap<WebSocket, UserRole>();
const validRoles = new Set<UserRole>(['cajero', 'cocina', 'gerente', 'host', 'mesero']);
const validOrderStatuses = new Set<OrderStatus>(['pendiente', 'preparacion', 'listo', 'entregado']);

for (const mesa of restaurantData.mesas) {
  if (mesa.estado !== 'limpieza') {
    actualizarMesa(mesa.id);
  }
}

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/{*splat}', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: process.env['NODE_ENV'] === 'production' ? '1y' : 0,
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  const server = createServer(app);
  webSocketServer.on('connection', (webSocket) => {
    webSocket.send(JSON.stringify({ type: 'snapshot', data: restaurantData }));
    webSocket.on('message', (rawMessage) => {
      const role = socketRoles.get(webSocket);
      if (role) procesarMensaje(role, rawMessage.toString());
    });
  });

  server.on('upgrade', (request, socket, head) => {
    const requestUrl = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);
    const token = requestUrl.searchParams.get('token') ?? '';
    const role = token.replace(/^demo:/, '') as UserRole;
    if (requestUrl.pathname !== '/ws/ordenes' || token !== `demo:${role}` || !validRoles.has(role)) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    webSocketServer.handleUpgrade(request, socket, head, (webSocket) => {
      socketRoles.set(webSocket, role);
      webSocketServer.emit('connection', webSocket, request);
    });
  });

  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

function actualizarMesa(mesaId: number): void {
  const table = restaurantData.mesas.find((mesa) => mesa.id === mesaId);
  const orders = restaurantData.ordenes.filter((order) => order.mesaId === mesaId);
  if (!table) return;
  if (orders.length === 0) {
    if (table.estado !== 'limpieza') {
      table.estado = 'disponible';
      table.progreso = 0;
      delete table.nota;
    }
    return;
  }

  const progress = orders.reduce(
    (total, order) => total + { pendiente: 0, preparacion: 50, listo: 75, entregado: 100 }[order.estado],
    0,
  );
  table.progreso = Math.round(progress / orders.length);
  if (orders.every((order) => order.estado === 'entregado')) table.estado = 'entregada';
  else if (orders.some((order) => order.estado === 'listo')) table.estado = 'lista';
  else if (table.estado !== 'cuenta') table.estado = 'preparando';
}

function publicarSnapshot(): void {
  const message = JSON.stringify({ type: 'snapshot', data: restaurantData });
  for (const client of webSocketServer.clients) {
    if (client.readyState === WebSocket.OPEN) client.send(message);
  }
}

interface ClientMessage {
  type?: string;
  orderId?: string;
  estado?: OrderStatus;
  nombre?: string;
  disponible?: boolean;
  mesaId?: string;
  mesa?: string;
  cantidad?: string;
  detalle?: string;
  accion?: 'entrega' | 'cuenta' | 'cobro' | 'disponible' | 'limpieza' | 'preparando' | 'demora' | 'entregada';
}

function procesarMensaje(role: UserRole, rawMessage: string): void {
  let message: ClientMessage;
  try {
    message = JSON.parse(rawMessage) as ClientMessage;
  } catch {
    return;
  }

  if (message.type === 'update-status') {
    actualizarEstadoOrden(role, message);
  } else if (message.type === 'update-menu') {
    actualizarDisponibilidad(role, message);
  } else if (message.type === 'add-order') {
    agregarOrden(role, message);
  } else if (message.type === 'update-table') {
    actualizarMesaPorAccion(role, message);
  } else if (message.type === 'complete-delivery') {
    confirmarEntregaCompleta(role, message);
  } else if (message.type === 'start-cleaning') {
    iniciarLimpieza(role, message);
  } else if (message.type === 'finish-cleaning') {
    finalizarLimpieza(role, message);
  }
}

function agregarOrden(role: UserRole, message: ClientMessage): void {
  if (role !== 'mesero' || !message.nombre || !message.mesaId || !message.mesa || !message.cantidad) return;

  const menuItem = restaurantData.menuItems.find((item) => item.nombre === message.nombre);
  const mesaId = Number(message.mesaId);
  const cantidad = Number(message.cantidad);
  if (
    !menuItem ||
    !menuItem.disponible ||
    !Number.isInteger(mesaId) ||
    !Number.isInteger(cantidad) ||
    cantidad < 1 ||
    cantidad > 20 ||
    !restaurantData.mesas.some((mesa) => mesa.id === mesaId)
  ) return;

  const mesa = restaurantData.mesas.find((item) => item.id === mesaId);
  if (!mesa) return;
  if (mesa.estado === 'limpieza') return;
  if (mesa.estado === 'cuenta') {
    mesa.estado = 'preparando';
    delete mesa.nota;
  }
  const detalle = (message.detalle ?? '').trim().slice(0, 180);
  const nextId = Math.max(0, ...restaurantData.ordenes.map((order) => Number(order.id) || 0)) + 1;
  const nextComanda = restaurantData.ordenes
    .filter((order) => order.mesaId === mesaId)
    .map((order) => Number(order.comanda.replace('#', '')))
    .filter(Number.isFinite)
    .reduce((max, value) => Math.max(max, value), 0);

  restaurantData.ordenes.push({
    id: String(nextId),
    comanda: nextComanda ? `#${nextComanda}` : `#${100 + nextId}`,
    mesaId,
    mesa: mesa.nombre,
    platillo: menuItem.nombre,
    detalle: detalle || 'Sin especificaciones',
    cantidad,
    precio: menuItem.precio * cantidad,
    estado: 'pendiente',
    horaSolicitud: new Intl.DateTimeFormat('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: restaurantData.restaurante.zonaHoraria,
    }).format(new Date()),
  });
  actualizarMesa(mesaId);
  publicarSnapshot();
}

function actualizarEstadoOrden(role: UserRole, message: ClientMessage): void {
  if (!message.orderId || !message.estado || !validOrderStatuses.has(message.estado)) return;
  const order = restaurantData.ordenes.find((item) => item.id === message.orderId);
  if (!order || !transicionPermitida(role, order.estado, message.estado)) return;

  order.estado = message.estado;
  actualizarMesa(order.mesaId);
  publicarSnapshot();
}

function actualizarMesaPorAccion(role: UserRole, message: ClientMessage): void {
  if (!message.accion || !message.mesaId) return;
  const mesa = restaurantData.mesas.find((item) => item.id === Number(message.mesaId));
  if (!mesa) return;

  if (mesa.estado === 'limpieza') return;
  if (message.accion === 'cuenta' && role === 'mesero') {
    const ordenesMesa = restaurantData.ordenes.filter((order) => order.mesaId === mesa.id);
    restaurantData.cuentasPendientes = restaurantData.cuentasPendientes
      .filter((order) => order.mesaId !== mesa.id)
      .concat(ordenesMesa);
    restaurantData.ordenes = restaurantData.ordenes.filter((order) => order.mesaId !== mesa.id);
    mesa.estado = 'cuenta';
    mesa.nota = 'Cuenta solicitada por el mesero.';
  } else if (message.accion === 'entrega' && role === 'mesero') {
    const orders = restaurantData.ordenes.filter((order) => order.mesaId === mesa.id);
    if (!orders.length || !orders.every((order) => order.estado === 'entregado')) return;
    mesa.estado = 'entregada';
    mesa.progreso = 100;
    mesa.nota = 'Entrega completa confirmada.';
  } else if (message.accion === 'cobro' && role === 'cajero') {
    restaurantData.cuentasPendientes = restaurantData.cuentasPendientes
      .filter((order) => order.mesaId !== mesa.id);
    mesa.estado = 'limpieza';
    mesa.progreso = 100;
    mesa.limpiezaInicio = undefined;
    mesa.nota = 'Cuenta cobrada. Limpieza pendiente de iniciar.';
  } else if (role === 'host' && ['disponible', 'limpieza', 'preparando', 'demora', 'entregada'].includes(message.accion)) {
    const nuevoEstado = message.accion;
    if (nuevoEstado !== 'disponible' && nuevoEstado !== 'limpieza' && nuevoEstado !== 'preparando' && nuevoEstado !== 'demora' && nuevoEstado !== 'entregada') return;
    mesa.estado = nuevoEstado;
    mesa.nota = message.accion === 'limpieza' ? 'Limpieza pendiente de iniciar.' : undefined;
    if (message.accion === 'limpieza') mesa.limpiezaInicio = undefined;
    if (message.accion !== 'limpieza') mesa.limpiezaInicio = undefined;
  } else {
    return;
  }
  publicarSnapshot();
}

function iniciarLimpieza(role: UserRole, message: ClientMessage): void {
  if ((role !== 'mesero' && role !== 'host') || !message.mesaId) return;
  const mesa = restaurantData.mesas.find((item) => item.id === Number(message.mesaId));
  if (!mesa || mesa.estado !== 'limpieza') return;
  if (mesa.limpiezaInicio) return;
  mesa.limpiezaInicio = new Date().toISOString();
  mesa.nota = 'Limpieza en curso.';
  publicarSnapshot();
}

function finalizarLimpieza(role: UserRole, message: ClientMessage): void {
  if (role !== 'mesero' || !message.mesaId) return;
  const mesa = restaurantData.mesas.find((item) => item.id === Number(message.mesaId));
  if (!mesa || mesa.estado !== 'limpieza' || !mesa.limpiezaInicio) return;
  mesa.estado = 'disponible';
  mesa.progreso = 0;
  mesa.limpiezaInicio = undefined;
  mesa.nota = 'Limpieza finalizada.';
  publicarSnapshot();
}

function confirmarEntregaCompleta(role: UserRole, message: ClientMessage): void {
  if (role !== 'mesero' || !message.mesaId) return;
  const mesa = restaurantData.mesas.find((item) => item.id === Number(message.mesaId));
  if (!mesa) return;

  const ordenesListas = restaurantData.ordenes.filter(
    (order) => order.mesaId === mesa.id && order.estado === 'listo',
  );
  if (!ordenesListas.length) return;

  ordenesListas.forEach((order) => {
    order.estado = 'entregado';
  });
  actualizarMesa(mesa.id);
  if (restaurantData.ordenes
    .filter((order) => order.mesaId === mesa.id)
    .every((order) => order.estado === 'entregado')) {
    mesa.estado = 'entregada';
    mesa.progreso = 100;
    mesa.nota = 'Entrega completa confirmada.';
  }
  publicarSnapshot();
}

function transicionPermitida(role: UserRole, current: OrderStatus, next: OrderStatus): boolean {
  if (role === 'cocina') {
    const transitions: Record<OrderStatus, OrderStatus[]> = {
      pendiente: ['preparacion'],
      preparacion: ['pendiente', 'listo'],
      listo: ['preparacion'],
      entregado: [],
    };
    return transitions[current].includes(next);
  }
  return role === 'mesero' && current === 'listo' && next === 'entregado';
}

function actualizarDisponibilidad(role: UserRole, message: ClientMessage): void {
  if (role !== 'cocina' || !message.nombre || typeof message.disponible !== 'boolean') return;
  const menuItem = restaurantData.menuItems.find((item) => item.nombre === message.nombre);
  if (!menuItem) return;
  menuItem.disponible = message.disponible;
  publicarSnapshot();
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
