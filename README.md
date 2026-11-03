# MiPwa — prototipo de operación para restaurante

Aplicación Angular 22 con renderizado en servidor, paneles por rol y sincronización en tiempo real entre cocina y meseros mediante WebSocket.

## Requisitos

- Node.js compatible con Angular 22.
- npm 10 o superior.

## Iniciar el prototipo

```bash
npm install
npm start
```

Abre <http://localhost:4000> en dos ventanas o dispositivos conectados al mismo servidor. Inicia sesión en una con el rol `cocina` y en otra con `mesero`. El servidor SSR y el endpoint `/ws/ordenes` usan el mismo puerto; `ng serve` por sí solo no inicia el WebSocket. El puerto se puede cambiar con la variable de entorno `PORT`.

### Cuentas de demostración

| Usuario | Contraseña |
| --- | --- |
| `cocina` | `cocina123` |
| `mesero` | `mesero123` |
| `cajero` | `cajero123` |
| `gerente` | `gerente123` |
| `host` | `host123` |

### Flujo de cocina y meseros

- Cocina puede mover los platillos de pendiente a preparación y de preparación a listo, o retroceder un estado.
- El mesero ve los cambios de órdenes y mesas en tiempo real y puede confirmar la entrega de los platillos listos de la mesa seleccionada.
- La cocina puede cambiar la disponibilidad de los platillos del menú.
- Los controles que modifican estados se desactivan mientras no hay conexión WebSocket.
- El servidor valida el rol y las transiciones permitidas antes de propagar cada cambio.
- En el panel de mesero, agregar pedidos y solicitar la cuenta solo muestran avisos locales; esas acciones aún no se guardan ni se sincronizan.

## Datos de demostración

`public/data/restaurante-mx.json` contiene el menú, las mesas y las órdenes del prototipo, con precios en pesos mexicanos, locale `es-MX`, país `MX` y zona horaria `America/Mexico_City`. El servidor carga este archivo en memoria al iniciar. Los cambios no se persisten y se pierden al reiniciar el servidor.

## Protección de rutas y autenticación

`src/app/core/auth/role.guard.ts` restringe las rutas por rol y redirige las sesiones no autorizadas. `src/app/core/auth/auth.interceptor.ts` agrega el token a las solicitudes de `/api/`. Las credenciales y los tokens son simulados en el cliente y el WebSocket usa tokens de demostración: estas medidas sirven únicamente para el prototipo y **no constituyen autenticación ni autorización de producción**. No se debe exponer este sistema a usuarios o redes no confiables.

## Comandos

```bash
npm run build       # Compila cliente y servidor
npm test            # Ejecuta pruebas unitarias
npm run watch       # Recompila en modo desarrollo
```

Para operar con sincronización en tiempo real, inicia el servidor mediante `npm start` o compila y ejecuta el servidor SSR generado; el comando `ng serve` no ofrece el endpoint WebSocket.
