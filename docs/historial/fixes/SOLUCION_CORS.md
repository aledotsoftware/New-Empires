# ⚠️ ERROR CORS - Solución Requerida

## 🔴 Problema Detectado

El navegador está bloqueando la carga de archivos JSON con este error:
```
Access to fetch at 'file:///...' has been blocked by CORS policy
```

**Razón:** Los navegadores no permiten hacer peticiones `fetch()` desde archivos locales (`file://`) por razones de seguridad.

## ✅ Solución: Usar un Servidor Web Local

Para que el juego funcione correctamente, necesitas ejecutarlo en un servidor web local.

### **Opción 1: Live Server (VSCode)** ⭐ RECOMENDADO

Si usas Visual Studio Code:

1. **Instala la extensión "Live Server"**
   - Abre VSCode
   - Ve a Extensions (Ctrl+Shift+X)
   - Busca "Live Server"
   - Instala la extensión de Ritwick Dey

2. **Ejecuta el servidor**
   - Abre el proyecto en VSCode
   - Click derecho en `index.html`
   - Selecciona "Open with Live Server"
   - Se abrirá automáticamente en: `http://127.0.0.1:5500`

3. **Recarga automática**
   - Live Server recarga automáticamente cuando guardas cambios
   - Perfecto para desarrollo

### **Opción 2: Python HTTP Server**

Si tienes Python instalado:

```powershell
# En la carpeta del proyecto, ejecuta:
python -m http.server 8000
```

Luego abre: `http://localhost:8000`

### **Opción 3: Node.js http-server**

Si tienes Node.js:

```powershell
# Instalar (una sola vez)
npm install -g http-server

# Ejecutar en la carpeta del proyecto
http-server -p 8000
```

Luego abre: `http://localhost:8000`

### **Opción 4: PHP Built-in Server**

Si tienes PHP:

```powershell
php -S localhost:8000
```

Luego abre: `http://localhost:8000`

---

## 🎯 Después de Iniciar el Servidor

Una vez que tengas un servidor corriendo:

1. ✅ Los archivos JSON se cargarán correctamente
2. ✅ DataLoader funcionará
3. ✅ Las tecnologías se personalizarán por civilización
4. ✅ El timeline horizontal mostrará las 30 edades

---

## 🔍 Verificar que Funciona

Abre la consola del navegador (F12) y deberías ver:

```
🚀 Iniciando carga de datos del juego...
🚀 Inicializando DataLoader...
🔄 Cargando datos base...
✅ Datos base cargados: {technologies: 10, buildings: 7, units: 8, ages: 30}
✅ 2 civilizaciones cargadas
✅ DataLoader inicializado correctamente
✅ Datos de tecnologías cargados
```

---

## 📝 Alternativa SIN Servidor (Menos Recomendado)

Si NO puedes usar un servidor local, una alternativa es:

1. **Embeber los datos JSON directamente en JavaScript**
   - Copiar el contenido de los JSON
   - Pegarlos como objetos JavaScript en el código
   - Pero perderías la modularidad del sistema

**No recomendamos esto** porque el propósito del sistema JSON es precisamente separar datos del código.

---

## ✨ Recomendación Final

**Usa Live Server en VSCode** - Es la forma más fácil y profesional de desarrollar aplicaciones web modernas.

Una vez configurado, podrás:
- Ver cambios en tiempo real
- Cargar archivos JSON sin problemas
- Debug más fácil
- Experiencia de desarrollo profesional

🚀 ¡Listo para probar el sistema JSON completo!
