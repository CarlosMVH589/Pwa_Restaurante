import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { createServer } from 'node:http';
import { join } from 'node:path';
import { WebSocket, WebSocketServer } from 'ws';
import type { OrderStatus } from './app/core/orders/order.model';
import type { UserRole } from './app/core/auth/auth.service';
import * as db from './db';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();
const webSocketServer = new WebSocketServer({ noServer: true });
const socketRoles = new WeakMap<WebSocket, UserRole>();
const validRoles = new Set<UserRole>(['cajero', 'cocina', 'gerente', 'host', 'mesero']);
const validOrderStatuses = new Set<OrderStatus>(['pendiente', 'preparacion', 'listo', 'entregado']);

app.use(express.json());

function rolDe(req: express.Request): UserRole | null {
  const role = (req.headers.authorization ?? '').replace(/^Bearer demo:/, '') as UserRole;
  return validRoles.has(role) ? role : null;
}

function permitir(...roles: UserRole[]): express.RequestHandler {
  return (req, res, next) => {
    const role = rolDe(req);
    if (!role) return void res.status(401).json({ error: 'no autenticado' });
    if (!roles.includes(role)) return void res.status(403).json({ error: 'sin permiso' });
    next();
  };
}

const manejar = (fn: express.RequestHandler): express.RequestHandler => (req, res, next) =>
  void Promise.resolve(fn(req, res, next)).catch((error: Error) => res.status(400).json({ error: error.message }));

app.get('/api/reportes/ventas', permitir('gerente'), manejar(async (req, res) => {
  res.json(await db.reporteVentas(String(req.query['fecha'] ?? 'hoy'), String(req.query['turno'] ?? 'completo')));
}));

function platilloValido(body: unknown): db.PlatilloEntrada {
  const { nombre, precio, seccion, receta } = (body ?? {}) as Record<string, unknown>;
  if (typeof nombre !== 'string' || !nombre.trim() || nombre.trim().length > 60) throw new Error('nombre inválido');
  if (typeof precio !== 'number' || !Number.isFinite(precio) || precio <= 0 || precio > 99999) throw new Error('precio inválido');
  if (typeof seccion !== 'string') throw new Error('categoría inválida');
  if (receta === undefined) return { nombre, precio, seccion };
  if (!Array.isArray(receta) || receta.length > 20) throw new Error('receta inválida');
  const lineas = receta.map((linea) => {
    const { ingredienteId, cantidad } = (linea ?? {}) as Record<string, unknown>;
    if (!Number.isInteger(ingredienteId) || typeof cantidad !== 'number' || !(cantidad > 0) || cantidad > 10000) {
      throw new Error('receta inválida');
    }
    return { ingredienteId: ingredienteId as number, cantidad };
  });
  return { nombre, precio, seccion, receta: lineas };
}

app.get('/api/menu', permitir('gerente'), manejar(async (_req, res) => {
  res.json(await db.menuAdmin());
}));

app.get('/api/ingredientes', permitir('gerente'), manejar(async (_req, res) => {
  res.json(await db.listarIngredientes());
}));

app.post('/api/menu', permitir('gerente'), manejar(async (req, res) => {
  res.status(201).json({ id: await db.guardarPlatillo(null, platilloValido(req.body)) });
}));

app.put('/api/menu/:id', permitir('gerente'), manejar(async (req, res) => {
  const id = Number(req.params['id']);
  if (!Number.isInteger(id)) throw new Error('platillo inválido');
  res.json({ id: await db.guardarPlatillo(id, platilloValido(req.body)) });
}));

app.patch('/api/menu/:id/disponible', permitir('gerente'), manejar(async (req, res) => {
  const id = Number(req.params['id']);
  const disponible = (req.body as { disponible?: unknown }).disponible;
  if (!Number.isInteger(id) || typeof disponible !== 'boolean') throw new Error('datos inválidos');
  await db.platilloDisponible(id, disponible);
  res.status(204).end();
}));
app.get('/api/inventario/bajo', permitir('cocina', 'gerente'), manejar(async (_req, res) => {
  res.json(await db.stockBajo());
}));

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
    void db.cargarSnapshot().then((data) => webSocket.send(JSON.stringify({ type: 'snapshot', data })));
    webSocket.on('message', (rawMessage) => {
      const role = socketRoles.get(webSocket);
      if (role) void procesarMensaje(webSocket, role, rawMessage.toString());
    });
  });

  let pendiente: ReturnType<typeof setTimeout> | undefined;
  void db.escucharCambios(() => {
    clearTimeout(pendiente);
    pendiente = setTimeout(() => void publicarSnapshot().catch((error) => console.error(error)), 50);
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

async function publicarSnapshot(): Promise<void> {
  const message = JSON.stringify({ type: 'snapshot', data: await db.cargarSnapshot() });
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
  descuento?: string;
  accion?: 'entrega' | 'cuenta' | 'cobro' | 'disponible' | 'limpieza' | 'preparando' | 'demora' | 'entregada';
}

const estadosHost = new Set(['disponible', 'limpieza', 'preparando', 'demora', 'entregada']);

async function procesarMensaje(webSocket: WebSocket, role: UserRole, rawMessage: string): Promise<void> {
  let message: ClientMessage;
  try {
    message = JSON.parse(rawMessage) as ClientMessage;
  } catch {
    return;
  }

  try {
    await ejecutar(role, message);
  } catch (error) {
    const texto = error instanceof Error ? error.message : 'error desconocido';
    console.error(`[${role}] ${message.type}: ${texto}`);
    if (webSocket.readyState === WebSocket.OPEN) webSocket.send(JSON.stringify({ type: 'error', message: texto }));
  }
}

async function ejecutar(role: UserRole, message: ClientMessage): Promise<void> {
  const mesaId = Number(message.mesaId);
  const mesaValida = Number.isInteger(mesaId);

  if (message.type === 'update-status') {
    if (!message.orderId || !message.estado || !validOrderStatuses.has(message.estado)) return;
    const actual = await db.estadoItem(message.orderId);
    if (!actual || !transicionPermitida(role, actual, message.estado)) return;
    await db.actualizarEstadoItem(message.orderId, message.estado);
  } else if (message.type === 'update-menu') {
    if (role !== 'cocina' || !message.nombre || typeof message.disponible !== 'boolean') return;
    await db.actualizarDisponibilidad(message.nombre, message.disponible);
  } else if (message.type === 'add-order') {
    if (role !== 'mesero' || !message.nombre || !mesaValida) return;
    await db.agregarOrden(mesaId, message.nombre, Number(message.cantidad), (message.detalle ?? '').toString());
  } else if (message.type === 'update-table') {
    if (!message.accion || !mesaValida) return;
    if (message.accion === 'cuenta' && role === 'mesero') await db.solicitarCuenta(mesaId);
    else if (message.accion === 'entrega' && role === 'mesero') await db.confirmarEntrega(mesaId);
    else if (message.accion === 'cobro' && role === 'cajero') {
      const descuento = Number(message.descuento ?? 0);
      await db.cobrarMesa(mesaId, 'efectivo', Number.isFinite(descuento) ? descuento : 0);
    } else if (role === 'host' && estadosHost.has(message.accion)) await db.hostCambiarEstado(mesaId, message.accion);
  } else if (message.type === 'complete-delivery') {
    if (role === 'mesero' && mesaValida) await db.confirmarEntregaCompleta(mesaId);
  } else if (message.type === 'start-cleaning') {
    if ((role === 'mesero' || role === 'host') && mesaValida) await db.iniciarLimpieza(mesaId);
  } else if (message.type === 'finish-cleaning') {
    if (role === 'mesero' && mesaValida) await db.finalizarLimpieza(mesaId);
  }
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

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
