# GEM Frontend - Guía de Deploy y Versionado Docker

## 🎯 Objetivo

-   No modificar docker-compose.yml en cada deploy
-   Mantener historial de versiones
-   Permitir rollback inmediato
-   Unificar procedimiento con backend

------------------------------------------------------------------------

# 1️⃣ docker-compose.yml Estable

El frontend debe usar siempre `latest`.

``` yaml
services:
  gem:
    image: gem:latest
    container_name: gem
    ports:
      - "54210:80"
    restart: unless-stopped
    environment:
      - TZ=America/Argentina/Buenos_Aires
```

Este archivo no debe modificarse por versión.

------------------------------------------------------------------------

# 2️⃣ Build Local (Version + Latest)

Siempre generar: - Versión real (histórica) - Alias operativo `latest`

Ejemplo versión 0.0.4:

``` bash
docker build --no-cache -t gem:0.0.4 -t gem:latest .
docker save gem:0.0.4 -o gem_0.0.4.tar
```

------------------------------------------------------------------------

# 3️⃣ Deploy en Servidor

Copiar el `.tar` al servidor.

## Actualizar Frontend

``` bash
docker load -i gem_0.0.4.tar
docker tag gem:0.0.4 gem:latest
docker compose up -d
```

No es necesario eliminar contenedor manualmente. Docker recrea el
contenedor automáticamente si la imagen cambió.

------------------------------------------------------------------------

# 4️⃣ Rollback

Si la versión nueva falla:

``` bash
docker tag gem:0.0.3 gem:latest
docker compose up -d
```

Rollback inmediato sin reconstrucción.

------------------------------------------------------------------------

# 5️⃣ Organización Recomendada en Servidor

    /deploy
       gem_0.0.2.tar
       gem_0.0.3.tar
       gem_0.0.4.tar
    docker-compose.yml

------------------------------------------------------------------------

# 📌 Flujo Operativo Final

LOCAL: 1. Build versión + latest 2. Generar .tar 3. Copiar al servidor

SERVER: 1. docker load 2. docker tag versión → latest 3. docker compose
up -d

------------------------------------------------------------------------

# 🚀 Buenas Prácticas

-   Usar versionado semántico (MAJOR.MINOR.PATCH).
-   No editar docker-compose por versión.
-   Mantener histórico de imágenes en servidor.
-   Eliminar imágenes antiguas solo cuando sea necesario por espacio.
