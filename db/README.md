# Base de datos (PostgreSQL)

Una sola vez por máquina:

    sudo -u postgres createdb restaurante
    sudo -u postgres psql -c "alter user postgres password 'postgres'"
    sudo -u postgres psql -d restaurante -f db/schema.sql -f db/seed.sql
    npm install
    npm start

En Windows usa `psql -U postgres` en lugar de `sudo -u postgres psql`.
Para otro usuario o contraseña: variable `DATABASE_URL=postgresql://usuario:pass@localhost:5432/restaurante`.

Si ya tenías la BD de una versión anterior: `db/migracion-menu.sql` y `db/ajuste-papas.sql`.
Para empezar de cero: `dropdb restaurante` y repetir los pasos.
