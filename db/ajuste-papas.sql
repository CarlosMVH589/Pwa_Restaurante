update ingredientes set unidad = 'pza', stock = stock * 5, stock_minimo = stock_minimo * 5
 where nombre = 'Papa' and unidad = 'porc';

insert into recetas (menu_item_id, ingrediente_id, cantidad)
select m.id, i.id, 5
  from menu_items m, ingredientes i
 where m.nombre = 'Papas a la francesa' and i.nombre = 'Papa'
on conflict (menu_item_id, ingrediente_id) do update set cantidad = 5;
