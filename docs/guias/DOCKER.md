# 🐳 Guía de Despliegue Docker - New Empires

**Última actualización**: 2026-01-10

---

## 📋 Descripción General

New Empires es una aplicación estática (HTML5/CSS3/JavaScript vanilla) que se sirve a través de Nginx en un contenedor Docker. Esta guía cubre el despliegue local y en producción usando Docker y Docker Compose.

---

## 🎯 Arquitectura de Despliegue

```
┌─────────────────────────────────────────────┐
│                  Internet                    │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│            Traefik (Reverse Proxy)           │
│         (Labels en docker-compose.yml)       │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│           Docker Container                   │
│  ┌─────────────────────────────────────┐    │
│  │         Nginx (Alpine)               │    │
│  │         Puerto: 80                   │    │
│  │                                      │    │
│  │  /usr/share/nginx/html/             │    │
│  │    ├── index.html                   │    │
│  │    ├── main.js                      │    │
│  │    ├── js/                          │    │
│  │    ├── assets/                      │    │
│  │    └── *.css                        │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

---

## 🚀 Despliegue Rápido

### Opción 1: Docker Simple

```bash
# Construir imagen
docker build -t new-empires .

# Ejecutar contenedor
docker run -d -p 8080:80 --name new-empires new-empires

# Verificar
curl http://localhost:8080
```

### Opción 2: Docker Compose (Recomendado)

```bash
# Iniciar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener
docker-compose down
```

---

## 📁 Archivos de Configuración

### `Dockerfile`

```dockerfile
FROM public.ecr.aws/docker/library/nginx:alpine

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copiar archivos estáticos
COPY . /usr/share/nginx/html/

# Copiar configuración Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
```

**Características**:
- Base: Nginx Alpine (imagen ligera ~20MB)
- Curl para healthchecks
- Configuración Nginx personalizada

---

### `docker-compose.yml`

```yaml
services:
  newempire-pss-txn-01:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: newempire-pss-txn-01
    restart: unless-stopped
    
    ports:
      - "${PORT:-3000}:80"
    
    environment:
      - HOST=0.0.0.0
      - NODE_ENV=production
    
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
    
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
        reservations:
          cpus: '0.1'
          memory: 64M
```

**Características**:
- Puerto configurable via `$PORT`
- Healthcheck automático
- Límites de recursos (CPU/RAM)
- Logging optimizado
- Labels para Traefik/Dokploy

---

### `nginx.conf`

El archivo de configuración Nginx incluye:
- Headers de seguridad
- Caché de assets estáticos
- Compresión gzip
- MIME types correctos para ES6 modules

---

### `.dockerignore`

```
.git
.gitignore
*.md
docs/
node_modules/
.env*
*.log
.Jules/
backup_styles/
```

**Importante**: Excluye archivos sensibles y de desarrollo.

---

## 🌐 Despliegue en Producción

### Dokploy

El proyecto está configurado para Dokploy con:
- Labels de Traefik para routing
- Red `dokploy-network`
- Dominio: `newempire-pss-txn-01.tudexnetworks.com`

```bash
# Desplegar en Dokploy
dokploy deploy
```

### Manual con Traefik

1. Asegurar que Traefik está corriendo
2. Asegurar que la red `dokploy-network` existe:
```bash
docker network create dokploy-network
```
3. Iniciar con compose:
```bash
docker-compose up -d
```

---

## 📊 Monitoreo

### Ver logs

```bash
# Logs en tiempo real
docker-compose logs -f

# Últimos 100 logs
docker-compose logs --tail=100
```

### Verificar salud

```bash
# Estado del contenedor
docker ps

# Healthcheck
docker inspect --format='{{.State.Health.Status}}' newempire-pss-txn-01
```

### Métricas

```bash
# Uso de recursos
docker stats newempire-pss-txn-01
```

---

## 🔧 Comandos Útiles

### Reconstruir después de cambios

```bash
# Reconstruir sin caché
docker-compose build --no-cache

# Reiniciar con nueva imagen
docker-compose up -d --build
```

### Entrar al contenedor

```bash
docker exec -it newempire-pss-txn-01 /bin/sh
```

### Ver archivos servidos

```bash
docker exec -it newempire-pss-txn-01 ls -la /usr/share/nginx/html/
```

### Limpiar

```bash
# Detener y eliminar
docker-compose down

# Eliminar imagen
docker rmi new-empires

# Limpiar todo
docker system prune -a
```

---

## 🔒 Seguridad

### Headers de Seguridad (nginx.conf)

El archivo `nginx.conf` incluye:
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

### Buenas Prácticas

- ✅ No exponer puertos innecesarios
- ✅ Usar `.dockerignore` para excluir archivos sensibles
- ✅ Limitar recursos del contenedor
- ✅ Usar imagen base oficial (nginx:alpine)

---

## ⚡ Optimización

### Caché de Assets

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### Compresión

```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1000;
```

---

## 🐛 Troubleshooting

### El contenedor no inicia

```bash
# Ver logs de error
docker-compose logs

# Verificar Dockerfile
docker build -t test .
```

### Error 502 Bad Gateway

- Verificar que nginx está corriendo dentro del contenedor
- Verificar configuración de Traefik

### Assets no cargan

- Verificar rutas relativas en el código
- Verificar que los archivos están en `/usr/share/nginx/html/`

### CORS errors

- Agregar headers en nginx.conf:
```nginx
add_header 'Access-Control-Allow-Origin' '*';
```

---

## 📝 Variables de Entorno

| Variable | Default | Descripción |
|----------|---------|-------------|
| `PORT` | 3000 | Puerto expuesto en el host |
| `NODE_ENV` | production | Entorno de ejecución |

---

**Ver también**: [INSTALACION.md](INSTALACION.md) | [DESARROLLO.md](DESARROLLO.md)
