# 🚀 Guía de Instalación - New Empires

**Última actualización**: 2026-01-10

---

## 📋 Prerrequisitos

### Navegador Web Moderno
- Chrome 90+
- Firefox 88+
- Edge 90+
- Safari 14+

### Servidor HTTP Local
**⚠️ IMPORTANTE**: El juego NO funciona con protocolo `file://` debido al uso de módulos ES6.

---

## 🔧 Métodos de Instalación

### Método 1: VS Code Live Server (⭐ Recomendado)

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/New-Empires.git
cd New-Empires

# 2. Abrir con VS Code
code .

# 3. Instalar extensión "Live Server"
#    - Ir a Extensions (Ctrl+Shift+X)
#    - Buscar "Live Server" de Ritwick Dey
#    - Instalar

# 4. Iniciar servidor
#    - Click derecho en index.html
#    - Seleccionar "Open with Live Server"
#    - Se abrirá automáticamente en http://127.0.0.1:5500
```

**Ventajas**:
- Recarga automática al guardar cambios
- Perfecto para desarrollo
- Fácil de usar

---

### Método 2: Python HTTP Server

```bash
# Navegar a la carpeta del proyecto
cd /ruta/a/New-Empires

# Python 3
python -m http.server 8000

# Abrir en navegador
# http://localhost:8000
```

---

### Método 3: Node.js http-server

```bash
# Instalar http-server (una sola vez)
npm install -g http-server

# Navegar a la carpeta del proyecto
cd /ruta/a/New-Empires

# Ejecutar servidor
http-server

# Abrir en navegador
# http://localhost:8080
```

---

### Método 4: PHP Built-in Server

```bash
# Navegar a la carpeta del proyecto
cd /ruta/a/New-Empires

# Iniciar servidor
php -S localhost:8000

# Abrir en navegador
# http://localhost:8000
```

---

### Método 5: Docker 🐳

El proyecto incluye configuración Docker para ejecución en contenedor.

```bash
# Construir imagen
docker build -t new-empires .

# Ejecutar contenedor
docker run -p 8080:80 new-empires

# Abrir en navegador
# http://localhost:8080
```

**Con Docker Compose**:
```bash
# Iniciar servicios
docker-compose up -d

# Detener servicios
docker-compose down
```

---

## ✅ Verificación de Instalación

1. **Abrir consola del navegador** (F12)
2. **Verificar que no hay errores**
3. **Deberías ver en consola**:
   ```
   🚀 Inicializando DataLoader...
   ✅ Datos base cargados
   ✅ X civilizaciones cargadas
   ✅ Juego iniciado correctamente
   ```
4. **Assets cargados correctamente** (sin errores 404)

---

## 🔧 Configuración de Desarrollo

### Variables de Entorno (Opcionales)

No se requieren variables de entorno para desarrollo básico.

### Estructura de Archivos Necesarios

```
New-Empires/
├── index.html          # Punto de entrada
├── main.js             # Módulo principal ES6
├── js/                 # Módulos del juego
├── assets/             # Imágenes, sonidos, JSON
├── *.css               # Estilos
└── [scripts legacy]    # Scripts auxiliares
```

---

## ⚠️ Problemas Comunes

### Error: "Access to fetch has been blocked by CORS policy"

**Causa**: Estás abriendo el archivo directamente con `file://`

**Solución**: Usar cualquiera de los servidores HTTP descritos arriba.

---

### Error: "Cannot use import statement outside a module"

**Causa**: El script no se está cargando como módulo ES6

**Solución**: Verificar que `index.html` tiene:
```html
<script type="module" src="main.js"></script>
```

---

### Error: "Failed to load module script"

**Causa**: Ruta incorrecta o servidor no iniciado

**Solución**: 
1. Verificar que el servidor está corriendo
2. Comprobar que las rutas de los módulos son correctas

---

### El juego no carga / Pantalla en blanco

**Verificar**:
1. Consola del navegador (F12) para errores
2. Que el servidor HTTP está activo
3. Que todos los archivos existen

---

## 🎮 Primer Inicio

1. Hacer click en **"Comenzar Juego"**
2. Seleccionar **tamaño de mapa** (7 opciones)
3. Seleccionar **civilización** (5 disponibles)
4. ¡El juego iniciará automáticamente!

---

## 📞 Soporte

Si encuentras problemas no documentados:
1. Revisa la [guía de troubleshooting](TROUBLESHOOTING.md)
2. Abre un issue en GitHub
3. Incluye:
   - Navegador y versión
   - Mensajes de error de la consola
   - Pasos para reproducir el problema

---

**Siguiente paso**: Lee [DESARROLLO.md](DESARROLLO.md) para guía de desarrollo
