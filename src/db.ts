import pg from 'pg';
import type { OrderStatus, RestaurantData, RestaurantOrder } from './app/core/orders/order.model';

const connectionString = process.env['DATABASE_URL'] ?? 'postgresql://postgres:postgres@localhost:5432/restaurante';
const pool = new pg.Pool({ connectionString });

const TZ = `'America/Mexico_City'`;

const restaurante: RestaurantData['restaurante'] = {
  nombre: 'Restaurante La Mesa',
  ciudad: 'Ciudad de México',
  estado: 'Ciudad de México',
  pais: 'MX',
  locale: 'es-MX',
  moneda: 'MXN',
  zonaHoraria: 'America/Mexico_City',
};

const consultaOrdenes = (cuenta: boolean) => `
  select oi.id::text as id,
         '#' || lpad(c.folio::text, 3, '0') as comanda,
         c.mesa_id as "mesaId",
         m.nombre as mesa,
         mi.nombre as platillo,
         oi.detalle,
         oi.cantidad,
         (oi.cantidad * oi.precio_unit)::float as precio,
         oi.estado,
         to_char(oi.creado_en at time zone ${TZ}, 'HH24:MI') as "horaSolicitud"
    from orden_items oi
    join comandas c on c.id = oi.comanda_id
    join mesas m on m.id = c.mesa_id
    join menu_items mi on mi.id = oi.menu_item_id
   where c.estado = 'abierta' and c.cuenta_solicitada = ${cuenta}
   order by oi.id`;

export async function cargarSnapshot(): Promise<RestaurantData> {
  const [menu, mesas, ordenes, cuentas] = await Promise.all([
    pool.query(`select nombre, precio::float as precio, disponible, categoria from menu_items order by id`),
    pool.query(`select id, nombre, zona, estado, capacidad, progreso, nota, limpieza_inicio from mesas order by id`),
    pool.query<RestaurantOrder>(consultaOrdenes(false)),
    pool.query<RestaurantOrder>(consultaOrdenes(true)),
  ]);

  return {
    restaurante,
    menuItems: menu.rows,
    mesas: mesas.rows.map(({ limpieza_inicio, nota, ...mesa }) => ({
      ...mesa,
      nota: nota ?? undefined,
      limpiezaInicio: limpieza_inicio ? limpieza_inicio.toISOString() : undefined,
    })),
    ordenes: ordenes.rows,
    cuentasPendientes: cuentas.rows,
  };
}

export async function estadoItem(id: string): Promise<OrderStatus | null> {
  if (!/^\d+$/.test(id)) return null;
  const { rows } = await pool.query(
    `select oi.estado from orden_items oi join comandas c on c.id = oi.comanda_id
      where oi.id = $1 and c.estado = 'abierta' and not c.cuenta_solicitada`,
    [id],
  );
  return rows[0]?.estado ?? null;
}

export async function actualizarEstadoItem(id: string, estado: OrderStatus): Promise<void> {
  await pool.query(`update orden_items set estado = $2 where id = $1`, [id, estado]);
}

export async function actualizarDisponibilidad(nombre: string, disponible: boolean): Promise<void> {
  await pool.query(`update menu_items set disponible = $2 where nombre = $1`, [nombre, disponible]);
}

export interface LineaReceta {
  ingredienteId: number;
  cantidad: number;
}

export interface PlatilloEntrada {
  nombre: string;
  precio: number;
  seccion: string;
  receta?: LineaReceta[];
}

export async function menuAdmin() {
  const { rows } = await pool.query(
    `select m.id, m.nombre, m.precio::float as precio, m.seccion, m.categoria, m.disponible,
            coalesce(json_agg(json_build_object('ingredienteId', i.id, 'nombre', i.nombre,
                                                'unidad', i.unidad, 'cantidad', r.cantidad::float)
                              order by i.nombre) filter (where i.id is not null), '[]') as receta
       from menu_items m
       left join recetas r on r.menu_item_id = m.id
       left join ingredientes i on i.id = r.ingrediente_id
      group by m.id order by m.id`,
  );
  return rows;
}

export async function listarIngredientes() {
  const { rows } = await pool.query(`select id, nombre, unidad, stock::float as stock from ingredientes order by nombre`);
  return rows;
}

export async function guardarPlatillo(id: number | null, platillo: PlatilloEntrada): Promise<number> {
  const receta = platillo.receta
    ? JSON.stringify(platillo.receta.map((l) => ({ ingrediente_id: l.ingredienteId, cantidad: l.cantidad })))
    : null;
  const { rows } = await pool.query(`select guardar_platillo($1, $2, $3, $4, $5::jsonb) as id`, [
    id, platillo.nombre, platillo.precio, platillo.seccion, receta,
  ]);
  return rows[0].id;
}

export async function platilloDisponible(id: number, disponible: boolean): Promise<void> {
  const { rowCount } = await pool.query(`update menu_items set disponible = $2 where id = $1`, [id, disponible]);
  if (!rowCount) throw new Error('platillo inexistente');
}

export async function agregarOrden(mesaId: number, nombre: string, cantidad: number, detalle: string): Promise<void> {
  await pool.query(`select agregar_orden($1, $2, $3, $4)`, [mesaId, nombre, cantidad, detalle]);
}

export async function solicitarCuenta(mesaId: number): Promise<void> {
  await pool.query(`select solicitar_cuenta($1)`, [mesaId]);
}

export async function confirmarEntrega(mesaId: number): Promise<void> {
  await pool.query(`select confirmar_entrega($1)`, [mesaId]);
}

export async function confirmarEntregaCompleta(mesaId: number): Promise<void> {
  await pool.query(`select confirmar_entrega_completa($1)`, [mesaId]);
}

export async function cobrarMesa(mesaId: number, metodo: 'efectivo' | 'tarjeta', descuento: number): Promise<void> {
  await pool.query(`select cobrar_mesa($1, $2, $3)`, [mesaId, metodo, descuento]);
}

export async function hostCambiarEstado(mesaId: number, estado: string): Promise<void> {
  await pool.query(`select host_cambiar_estado($1, $2)`, [mesaId, estado]);
}

export async function iniciarLimpieza(mesaId: number): Promise<void> {
  await pool.query(`select iniciar_limpieza($1)`, [mesaId]);
}

export async function finalizarLimpieza(mesaId: number): Promise<void> {
  await pool.query(`select finalizar_limpieza($1)`, [mesaId]);
}

const filtrosFecha: Record<string, string> = {
  hoy: `l::date = (now() at time zone ${TZ})::date`,
  ayer: `l::date = (now() at time zone ${TZ})::date - 1`,
  semana: `l >= date_trunc('week', now() at time zone ${TZ})`,
  mes: `l >= date_trunc('month', now() at time zone ${TZ})`,
};
const filtrosTurno: Record<string, string> = {
  completo: 'true',
  matutino: 'extract(hour from l) < 15',
  vespertino: 'extract(hour from l) >= 15',
};

export async function reporteVentas(fecha: string, turno: string) {
  const f = filtrosFecha[fecha] ?? filtrosFecha['hoy'];
  const t = filtrosTurno[turno] ?? filtrosTurno['completo'];
  const cobrosPagados = `select b.id, b.comanda_id, b.total, (b.pagado_en at time zone ${TZ}) as l
                           from cobros b where b.estado = 'pagado'`;

  const [resumen, detalle] = await Promise.all([
    pool.query(
      `select coalesce(sum(total), 0)::float as ventas, count(*)::int as tickets
         from (${cobrosPagados}) c where ${f} and ${t}`,
    ),
    pool.query(
      `select mi.nombre as producto, mi.categoria, sum(oi.cantidad)::int as unidades,
              sum(oi.cantidad * oi.precio_unit)::float as total
         from (${cobrosPagados}) c
         join orden_items oi on oi.comanda_id = c.comanda_id
         join menu_items mi on mi.id = oi.menu_item_id
        where ${f} and ${t}
        group by mi.nombre, mi.categoria
        order by total desc`,
    ),
  ]);

  const { ventas, tickets } = resumen.rows[0];
  const maximo = detalle.rows[0]?.total ?? 1;
  return {
    ventasTotales: ventas,
    ticketPromedio: tickets ? ventas / tickets : 0,
    transacciones: tickets,
    detalle: detalle.rows,
    top: detalle.rows.slice(0, 5).map((r, i) => ({
      posicion: i + 1,
      nombre: `${i + 1}. ${r.producto}`,
      monto: r.total,
      porcentajeAncho: Math.round((r.total / maximo) * 100),
    })),
  };
}

export async function stockBajo() {
  const { rows } = await pool.query(`select nombre, unidad, stock::float as stock, stock_minimo::float as "stockMinimo" from v_stock_bajo`);
  return rows;
}

export async function escucharCambios(onChange: () => void): Promise<void> {
  const conectar = async (): Promise<void> => {
    const client = new pg.Client({ connectionString: connectionString });
    client.on('error', () => undefined);
    client.on('end', () => setTimeout(() => void conectar().catch(() => undefined), 2000));
    client.on('notification', onChange);
    try {
      await client.connect();
      await client.query('listen cambios');
    } catch {
      client.removeAllListeners('end');
      setTimeout(() => void conectar(), 2000);
    }
  };
  await conectar();
}
