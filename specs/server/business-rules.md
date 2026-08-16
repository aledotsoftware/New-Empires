# Especificación de Reglas de Negocio: Servidor HTTP & Assets

## Dominio
**Servidor HTTP Estático, Seguridad, Proxy Inverso y Entrega de Recursos**

## 1. Comportamiento Esperado
- El servidor debe responder exclusivamente a peticiones con métodos `GET` y `HEAD`.
- La ruta raíz `/` debe servir el archivo `index.html` con un tipo MIME `text/html; charset=utf-8`.
- Toda petición de archivos debe resolverse estrictamente dentro de la raíz del proyecto.
- Mapeo estricto de tipos MIME:
  - `.html`: `text/html; charset=utf-8`
  - `.js`: `text/javascript; charset=utf-8`
  - `.css`: `text/css; charset=utf-8`
  - `.json`: `application/json; charset=utf-8`
  - `.webmanifest`: `application/manifest+json; charset=utf-8`
  - `.png`: `image/png`
  - `.jpg`, `.jpeg`: `image/jpeg`
  - `.webp`: `image/webp`
  - `.svg`: `image/svg+xml; charset=utf-8`
  - `.ico`: `image/x-icon`
  - `.wav`: `audio/wav`
  - `.mp3`: `audio/mpeg`

## 2. Límites, Seguridad y Proxy Inverso
- **Soporte de Reverse Proxy (`TRUST_PROXY`)**:
  - Cuando `process.env.TRUST_PROXY === 'true'`, la dirección IP del cliente se extrae evaluando el último elemento del encabezado `X-Forwarded-For` para evitar suplantaciones (*IP Spoofing*).
  - De lo contrario, se utiliza la IP directa de la conexión del socket (`req.socket.remoteAddress`).
- **Protección contra Traversal de Rutas**: Toda petición con secuencias como `..` o caracteres nulos `%00` debe ser rechazada inmediatamente retornando `404 Not Found` o `400 Bad Request`.
- **Restricción de Métodos**: Peticiones `POST`, `PUT`, `DELETE`, `PATCH`, `OPTIONS` deben ser rechazadas con código HTTP `405 Method Not Allowed` e incluir la cabecera `Allow: GET, HEAD`.
- **Control de Tasa (Rate Limiting)**:
  - Ventana móvil: 60,000 ms (1 minuto).
  - Umbral máximo: 10,000 peticiones por IP en dicha ventana.
  - Al exceder el umbral, retornar `429 Too Many Requests`.
- **Cabeceras de Seguridad Obligatorias**:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Content-Security-Policy`: Restringida a recursos de origen propio (`'self'`) y fuentes autorizadas de Google Fonts.
  - `Strict-Transport-Security: max-age=63072000`

## 3. Caché de Recursos Estáticos (LRU Cache)
- Los recursos estáticos menores a 5 MB pueden ser almacenados en una caché LRU en memoria con un límite de hasta 50 elementos.
- El archivo `index.html` no debe ser almacenado en caché de navegador para garantizar que las actualizaciones de los módulos JS sean inmediatamente visibles (`Cache-Control: no-cache`).
