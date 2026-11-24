alter table menu_items add column if not exists seccion text not null default 'Platillos Fuertes';

update menu_items set seccion = case
  when categoria = 'bebida' then 'Bebidas'
  when nombre in ('Sopa azteca','Ensalada de nopales') then 'Sopas & Entradas'
  when nombre in ('Hamburguesa BBQ','Papas a la francesa') then 'Hamburguesas & Snacking'
  when nombre = 'Flan de la casa' then 'Postres'
  else 'Platillos Fuertes' end;

alter table menu_items drop constraint if exists menu_items_seccion_check;
alter table menu_items add constraint menu_items_seccion_check
  check (seccion in ('Hamburguesas & Snacking','Sopas & Entradas','Platillos Fuertes','Bebidas','Postres'));

drop trigger if exists trg_notif_menu on menu_items;
create trigger trg_notif_menu after insert or update or delete on menu_items
  for each statement execute function notificar_cambio();

drop function if exists guardar_platillo(int, text, numeric, text, jsonb);
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
