insert into usuarios (username, rol, nombre) values ('cajero','cajero','Cajero'),('cocina','cocina','Cocina'),('gerente','gerente','Gerente'),('host','host','Host'),('mesero','mesero','Mesero');
insert into mesas (id, nombre, zona, capacidad, estado, progreso) values
(1,'Gab 1','gabinetes',4,'entregada',100),
(2,'Gab 2','gabinetes',4,'disponible',0),
(3,'Gab 3','gabinetes',4,'preparando',66),
(4,'Gab 4','gabinetes',4,'demora',50),
(101,'Privado 1','privados',6,'entregada',100),
(102,'Privado 2','privados',6,'limpieza',0),
(103,'Privado 3','privados',6,'disponible',0),
(5,'Mesa 1','central',4,'disponible',0),
(6,'Mesa 2','central',4,'entregada',100),
(7,'Mesa 3','central',4,'preparando',33),
(8,'Mesa 4','central',4,'disponible',0),
(9,'Mesa 5','central',2,'limpieza',0),
(10,'Mesa 6','central',2,'disponible',0),
(201,'Barra 1','barra',1,'entregada',100),
(202,'Barra 2','barra',1,'disponible',0),
(203,'Barra 3','barra',1,'preparando',66);
insert into menu_items (nombre, precio, categoria, disponible, seccion) values
('Taco de barbacoa',48,'platillo',true,'Platillos Fuertes'),
('Sopa azteca',95,'platillo',true,'Sopas & Entradas'),
('Ensalada de nopales',110,'platillo',false,'Sopas & Entradas'),
('Hamburguesa BBQ',165,'platillo',true,'Hamburguesas & Snacking'),
('Papas a la francesa',65,'platillo',true,'Hamburguesas & Snacking'),
('Flan de la casa',72,'platillo',false,'Postres'),
('Agua de jamaica',38,'bebida',true,'Bebidas');
insert into ingredientes (nombre, unidad, stock, stock_minimo) values
('Pan de hamburguesa','pza',50,10),('Carne de res','pza',50,10),('Queso','reb',100,20),
('Barbacoa','porc',60,10),('Tortilla','pza',200,40),('Papa','pza',200,40),('Jamaica','vaso',60,10);
insert into recetas (menu_item_id, ingrediente_id, cantidad)
select m.id, i.id, r.c from (values
('Hamburguesa BBQ','Pan de hamburguesa',1),('Hamburguesa BBQ','Carne de res',1),('Hamburguesa BBQ','Queso',1),
('Taco de barbacoa','Barbacoa',1),('Taco de barbacoa','Tortilla',1),
('Papas a la francesa','Papa',5),('Agua de jamaica','Jamaica',1)
) r(p,g,c) join menu_items m on m.nombre=r.p join ingredientes i on i.nombre=r.g;
insert into comandas (folio, mesa_id, mesero) values (104,7,'mesero');
insert into cobros (comanda_id) select id from comandas where folio=104;
insert into comandas (folio, mesa_id, mesero) values (105,5,'mesero');
insert into cobros (comanda_id) select id from comandas where folio=105;
insert into comandas (folio, mesa_id, mesero) values (98,8,'mesero');
insert into cobros (comanda_id) select id from comandas where folio=98;
insert into orden_items (comanda_id, menu_item_id, cantidad, precio_unit, detalle, estado, creado_en) select c.id, m.id, 1, 165.0, 'Sin cebolla', 'pendiente', ((current_date + time '13:15') at time zone 'America/Mexico_City') from comandas c, menu_items m where c.folio=104 and m.nombre='Hamburguesa BBQ';
insert into orden_items (comanda_id, menu_item_id, cantidad, precio_unit, detalle, estado, creado_en) select c.id, m.id, 1, 72.0, 'Con cajeta', 'pendiente', ((current_date + time '13:18') at time zone 'America/Mexico_City') from comandas c, menu_items m where c.folio=105 and m.nombre='Flan de la casa';
insert into orden_items (comanda_id, menu_item_id, cantidad, precio_unit, detalle, estado, creado_en) select c.id, m.id, 1, 95.0, 'Sin crema', 'preparacion', ((current_date + time '13:10') at time zone 'America/Mexico_City') from comandas c, menu_items m where c.folio=104 and m.nombre='Sopa azteca';
insert into orden_items (comanda_id, menu_item_id, cantidad, precio_unit, detalle, estado, creado_en) select c.id, m.id, 1, 110.0, 'Aderezo aparte', 'preparacion', ((current_date + time '13:05') at time zone 'America/Mexico_City') from comandas c, menu_items m where c.folio=98 and m.nombre='Ensalada de nopales';
insert into orden_items (comanda_id, menu_item_id, cantidad, precio_unit, detalle, estado, creado_en) select c.id, m.id, 2, 48.0, 'Dos piezas', 'listo', ((current_date + time '13:08') at time zone 'America/Mexico_City') from comandas c, menu_items m where c.folio=104 and m.nombre='Taco de barbacoa';
insert into orden_items (comanda_id, menu_item_id, cantidad, precio_unit, detalle, estado, creado_en) select c.id, m.id, 1, 38.0, 'Sin hielo', 'entregado', ((current_date + time '12:50') at time zone 'America/Mexico_City') from comandas c, menu_items m where c.folio=98 and m.nombre='Agua de jamaica';
select setval('folio_seq', 105);
select mesa_recalcular(id) from mesas;
