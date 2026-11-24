create table usuarios (
  id serial primary key,
  username text not null unique,
  rol text not null check (rol in ('cajero','cocina','gerente','host','mesero')),
  nombre text not null,
  activo boolean not null default true
);

create table mesas (
  id int primary key,
  nombre text not null,
  zona text not null check (zona in ('central','privados','gabinetes','barra')),
  capacidad int not null check (capacidad > 0),
  estado text not null default 'disponible'
    check (estado in ('disponible','preparando','lista','entregada','cuenta','demora','limpieza')),
  progreso int not null default 0 check (progreso between 0 and 100),
  nota text,
  limpieza_inicio timestamptz
);

create table menu_items (
  id serial primary key,
  nombre text not null unique,
  precio numeric(10,2) not null check (precio >= 0),
  seccion text not null default 'Platillos Fuertes'
    check (seccion in ('Hamburguesas & Snacking','Sopas & Entradas','Platillos Fuertes','Bebidas','Postres')),
  categoria text not null default 'platillo' check (categoria in ('platillo','bebida')),
  disponible boolean not null default true
);

create table ingredientes (
  id serial primary key,
  nombre text not null unique,
  unidad text not null,
  stock numeric(12,3) not null check (stock >= 0),
  stock_minimo numeric(12,3) not null default 0
);

create table recetas (
  menu_item_id int not null references menu_items(id) on delete cascade,
  ingrediente_id int not null references ingredientes(id),
  cantidad numeric(12,3) not null check (cantidad > 0),
  primary key (menu_item_id, ingrediente_id)
);

create sequence folio_seq start 1;

create table comandas (
  id serial primary key,
  folio int not null unique default nextval('folio_seq'),
  mesa_id int not null references mesas(id),
  mesero text,
  estado text not null default 'abierta' check (estado in ('abierta','cobrada','cancelada')),
  cuenta_solicitada boolean not null default false,
  creada_en timestamptz not null default now()
);

create table orden_items (
  id serial primary key,
  comanda_id int not null references comandas(id) on delete cascade,
  menu_item_id int not null references menu_items(id),
  cantidad int not null check (cantidad > 0),
  precio_unit numeric(10,2) not null,
  detalle text not null default 'Sin especificaciones',
  estado text not null default 'pendiente'
    check (estado in ('pendiente','preparacion','listo','entregado')),
  creado_en timestamptz not null default now()
);

create table cobros (
  id serial primary key,
  comanda_id int not null unique references comandas(id),
  total numeric(10,2) not null default 0,
  descuento numeric(5,2) not null default 0 check (descuento between 0 and 100),
  metodo text check (metodo in ('efectivo','tarjeta')),
  estado text not null default 'pendiente' check (estado in ('pendiente','pagado')),
  creado_en timestamptz not null default now(),
  pagado_en timestamptz
);

create table movimientos_inventario (
  id serial primary key,
  ingrediente_id int not null references ingredientes(id),
  orden_item_id int references orden_items(id) on delete set null,
  cantidad numeric(12,3) not null,
  fecha timestamptz not null default now()
);

create index on orden_items (comanda_id);
create index on orden_items (estado);
create unique index on comandas (mesa_id) where estado = 'abierta';

create function descontar_inventario() returns trigger language plpgsql as $$
declare v_falta text;
begin
  select string_agg(i.nombre, ', ') into v_falta
    from recetas r join ingredientes i on i.id = r.ingrediente_id
   where r.menu_item_id = new.menu_item_id and i.stock < r.cantidad * new.cantidad;
  if v_falta is not null then
    raise exception 'inventario insuficiente: %', v_falta;
  end if;

  update ingredientes i
     set stock = i.stock - r.cantidad * new.cantidad
    from recetas r
   where r.menu_item_id = new.menu_item_id and r.ingrediente_id = i.id;

  insert into movimientos_inventario (ingrediente_id, orden_item_id, cantidad)
  select ingrediente_id, new.id, -cantidad * new.cantidad
    from recetas where menu_item_id = new.menu_item_id;

  update menu_items m set disponible = false
   where m.disponible and exists (
     select 1 from recetas r join ingredientes i on i.id = r.ingrediente_id
      where r.menu_item_id = m.id and i.stock < r.cantidad);

  return new;
end $$;

create trigger trg_descontar_inventario
after insert on orden_items
for each row execute function descontar_inventario();

create function recalcular_cobro() returns trigger language plpgsql as $$
declare v_comanda int := coalesce(new.comanda_id, old.comanda_id);
begin
  update cobros
     set total = coalesce((select sum(cantidad * precio_unit) from orden_items where comanda_id = v_comanda), 0)
   where comanda_id = v_comanda and estado = 'pendiente';
  return null;
end $$;

create trigger trg_recalcular_cobro
after insert or update of cantidad, precio_unit or delete on orden_items
for each row execute function recalcular_cobro();

create function mesa_recalcular(p_mesa int) returns void language plpgsql as $$
declare
  v_estado text;
  v_total int;
  v_entregados int;
  v_listos int;
  v_prog int;
begin
  select estado into v_estado from mesas where id = p_mesa for update;
  if not found or v_estado = 'limpieza' then return; end if;

  select count(*),
         count(*) filter (where i.estado = 'entregado'),
         count(*) filter (where i.estado = 'listo'),
         coalesce(round(avg(case i.estado when 'pendiente' then 0 when 'preparacion' then 50
                                          when 'listo' then 75 else 100 end)), 0)
    into v_total, v_entregados, v_listos, v_prog
    from orden_items i join comandas c on c.id = i.comanda_id
   where c.mesa_id = p_mesa and c.estado = 'abierta' and not c.cuenta_solicitada;

  if v_total = 0 then
    if v_estado <> 'cuenta' then
      update mesas set estado = 'disponible', progreso = 0, nota = null where id = p_mesa;
    end if;
    return;
  end if;

  update mesas set progreso = v_prog,
         estado = case when v_entregados = v_total then 'entregada'
                       when v_listos > 0 then 'lista'
                       when v_estado = 'cuenta' then 'cuenta'
                       else 'preparando' end
   where id = p_mesa;
end $$;

create function trg_mesa_items() returns trigger language plpgsql as $$
declare v_mesa int;
begin
  select mesa_id into v_mesa from comandas where id = coalesce(new.comanda_id, old.comanda_id);
  if v_mesa is not null then perform mesa_recalcular(v_mesa); end if;
  return null;
end $$;

create trigger trg_mesa_items
after insert or update of estado or delete on orden_items
for each row execute function trg_mesa_items();

create function notificar_cambio() returns trigger language plpgsql as $$
begin
  perform pg_notify('cambios', tg_table_name);
  return null;
end $$;

create trigger trg_notif_items after insert or update or delete on orden_items
  for each statement execute function notificar_cambio();
create trigger trg_notif_mesas after update on mesas
  for each statement execute function notificar_cambio();
create trigger trg_notif_menu after insert or update or delete on menu_items
  for each statement execute function notificar_cambio();
create trigger trg_notif_comandas after update on comandas
  for each statement execute function notificar_cambio();
create trigger trg_notif_cobros after insert or update on cobros
  for each statement execute function notificar_cambio();

create function agregar_orden(p_mesa int, p_nombre text, p_cantidad int, p_detalle text default '', p_mesero text default 'mesero')
returns int language plpgsql as $$
declare
  v_estado text;
  v_item menu_items%rowtype;
  v_comanda int;
begin
  if p_cantidad is null or p_cantidad < 1 or p_cantidad > 20 then
    raise exception 'cantidad invalida';
  end if;

  select estado into v_estado from mesas where id = p_mesa for update;
  if not found then raise exception 'mesa inexistente'; end if;
  if v_estado = 'limpieza' then raise exception 'la mesa esta en limpieza'; end if;

  select * into v_item from menu_items where nombre = p_nombre and disponible;
  if not found then raise exception 'platillo no disponible'; end if;

  select id into v_comanda from comandas where mesa_id = p_mesa and estado = 'abierta';
  if not found then
    insert into comandas (mesa_id, mesero) values (p_mesa, p_mesero) returning id into v_comanda;
    insert into cobros (comanda_id) values (v_comanda);
  else
    update comandas set cuenta_solicitada = false where id = v_comanda and cuenta_solicitada;
  end if;

  if v_estado = 'cuenta' then
    update mesas set estado = 'preparando', nota = null where id = p_mesa;
  end if;

  insert into orden_items (comanda_id, menu_item_id, cantidad, precio_unit, detalle)
  values (v_comanda, v_item.id, p_cantidad, v_item.precio,
          coalesce(nullif(left(trim(p_detalle), 180), ''), 'Sin especificaciones'));
  return v_comanda;
end $$;

create function solicitar_cuenta(p_mesa int) returns void language plpgsql as $$
declare v_estado text;
begin
  select estado into v_estado from mesas where id = p_mesa for update;
  if not found or v_estado = 'limpieza' then raise exception 'mesa no valida'; end if;

  update comandas c set cuenta_solicitada = true
   where c.mesa_id = p_mesa and c.estado = 'abierta'
     and exists (select 1 from orden_items i where i.comanda_id = c.id);
  if not found then raise exception 'la mesa no tiene pedidos'; end if;

  update mesas set estado = 'cuenta', nota = 'Cuenta solicitada por el mesero.' where id = p_mesa;
end $$;

create function confirmar_entrega(p_mesa int) returns void language plpgsql as $$
declare v_estado text;
begin
  select estado into v_estado from mesas where id = p_mesa for update;
  if not found or v_estado = 'limpieza' then raise exception 'mesa no valida'; end if;

  if not exists (select 1 from orden_items i join comandas c on c.id = i.comanda_id
                  where c.mesa_id = p_mesa and c.estado = 'abierta' and not c.cuenta_solicitada)
     or exists (select 1 from orden_items i join comandas c on c.id = i.comanda_id
                 where c.mesa_id = p_mesa and c.estado = 'abierta' and not c.cuenta_solicitada
                   and i.estado <> 'entregado') then
    raise exception 'hay platillos sin entregar';
  end if;

  update mesas set estado = 'entregada', progreso = 100, nota = 'Entrega completa confirmada.' where id = p_mesa;
end $$;

create function confirmar_entrega_completa(p_mesa int) returns void language plpgsql as $$
begin
  update orden_items i set estado = 'entregado'
    from comandas c
   where i.comanda_id = c.id and c.mesa_id = p_mesa and c.estado = 'abierta'
     and not c.cuenta_solicitada and i.estado = 'listo';
  if not found then raise exception 'no hay platillos listos'; end if;

  if not exists (select 1 from orden_items i join comandas c on c.id = i.comanda_id
                  where c.mesa_id = p_mesa and c.estado = 'abierta' and not c.cuenta_solicitada
                    and i.estado <> 'entregado') then
    update mesas set estado = 'entregada', progreso = 100, nota = 'Entrega completa confirmada.' where id = p_mesa;
  end if;
end $$;

create function cobrar_mesa(p_mesa int, p_metodo text default 'efectivo', p_descuento numeric default 0)
returns void language plpgsql as $$
declare
  v_estado text;
  v_comanda int;
begin
  if p_descuento is null or p_descuento < 0 or p_descuento > 100 then
    raise exception 'descuento invalido';
  end if;

  select estado into v_estado from mesas where id = p_mesa for update;
  if not found or v_estado = 'limpieza' then raise exception 'mesa no valida'; end if;

  select id into v_comanda from comandas
   where mesa_id = p_mesa and estado = 'abierta' and cuenta_solicitada;
  if not found then raise exception 'la mesa no tiene cuenta solicitada'; end if;

  update cobros
     set estado = 'pagado', metodo = p_metodo, descuento = p_descuento, pagado_en = now(),
         total = round(coalesce((select sum(cantidad * precio_unit) from orden_items where comanda_id = v_comanda), 0)
                       * (1 - p_descuento / 100), 2)
   where comanda_id = v_comanda and estado = 'pendiente';
  if not found then raise exception 'cobro inexistente o ya pagado'; end if;

  update comandas set estado = 'cobrada' where id = v_comanda;
  update mesas set estado = 'limpieza', progreso = 100, limpieza_inicio = null,
         nota = 'Cuenta cobrada. Limpieza pendiente de iniciar.' where id = p_mesa;
end $$;

create function host_cambiar_estado(p_mesa int, p_estado text) returns void language plpgsql as $$
declare v_estado text;
begin
  if p_estado not in ('disponible','limpieza','preparando','demora','entregada') then
    raise exception 'estado invalido';
  end if;
  select estado into v_estado from mesas where id = p_mesa for update;
  if not found or v_estado = 'limpieza' then raise exception 'mesa no valida'; end if;

  update mesas set estado = p_estado, limpieza_inicio = null,
         nota = case when p_estado = 'limpieza' then 'Limpieza pendiente de iniciar.' end
   where id = p_mesa;
end $$;

create function iniciar_limpieza(p_mesa int) returns void language plpgsql as $$
begin
  update mesas set limpieza_inicio = now(), nota = 'Limpieza en curso.'
   where id = p_mesa and estado = 'limpieza' and limpieza_inicio is null;
  if not found then raise exception 'la mesa no esta pendiente de limpieza'; end if;
end $$;

create function finalizar_limpieza(p_mesa int) returns void language plpgsql as $$
begin
  update mesas set estado = 'disponible', progreso = 0, limpieza_inicio = null, nota = 'Limpieza finalizada.'
   where id = p_mesa and estado = 'limpieza' and limpieza_inicio is not null;
  if not found then raise exception 'la limpieza no ha iniciado'; end if;
end $$;

create function cancelar_comanda(p_comanda int) returns void language plpgsql as $$
declare v_mesa int;
begin
  update comandas set estado = 'cancelada' where id = p_comanda and estado = 'abierta'
  returning mesa_id into v_mesa;
  if not found then raise exception 'comanda inexistente o no abierta'; end if;

  update ingredientes i set stock = i.stock + m.devuelto
    from (select mv.ingrediente_id, sum(-mv.cantidad) as devuelto
            from movimientos_inventario mv join orden_items oi on oi.id = mv.orden_item_id
           where oi.comanda_id = p_comanda group by mv.ingrediente_id) m
   where i.id = m.ingrediente_id;

  delete from cobros where comanda_id = p_comanda and estado = 'pendiente';
  perform mesa_recalcular(v_mesa);
end $$;

create function guardar_platillo(p_id int, p_nombre text, p_precio numeric, p_seccion text, p_receta jsonb default null)
returns int language plpgsql as $$
declare
  v_id int;
  v_categoria text;
begin
  p_nombre := trim(p_nombre);
  if p_nombre is null or p_nombre = '' then raise exception 'el nombre es obligatorio'; end if;
  if p_precio is null or p_precio <= 0 then raise exception 'el precio debe ser mayor a 0'; end if;
  v_categoria := case when p_seccion = 'Bebidas' then 'bebida' else 'platillo' end;

  begin
    if p_id is null then
      insert into menu_items (nombre, precio, seccion, categoria)
      values (p_nombre, p_precio, p_seccion, v_categoria) returning id into v_id;
    else
      update menu_items set nombre = p_nombre, precio = p_precio, seccion = p_seccion, categoria = v_categoria
       where id = p_id returning id into v_id;
      if not found then raise exception 'platillo inexistente'; end if;
    end if;
  exception when unique_violation then
    raise exception 'ya existe un platillo con ese nombre';
  end;

  if p_receta is not null then
    delete from recetas where menu_item_id = v_id;
    insert into recetas (menu_item_id, ingrediente_id, cantidad)
    select v_id, t.ing, sum(t.cant)
      from (select (r->>'ingrediente_id')::int as ing, (r->>'cantidad')::numeric as cant
              from jsonb_array_elements(p_receta) r) t
     group by t.ing;
  end if;
  return v_id;
end $$;

create function reabastecer(p_nombre text, p_cantidad numeric) returns void language plpgsql as $$
declare v_id int;
begin
  if p_cantidad is null or p_cantidad <= 0 then raise exception 'cantidad invalida'; end if;
  update ingredientes set stock = stock + p_cantidad where nombre = p_nombre returning id into v_id;
  if not found then raise exception 'ingrediente inexistente'; end if;
  insert into movimientos_inventario (ingrediente_id, cantidad) values (v_id, p_cantidad);
end $$;

create view v_stock_bajo as
select * from ingredientes where stock <= stock_minimo;
