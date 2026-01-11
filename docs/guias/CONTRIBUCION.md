# 🤝 Guía de Contribución - New Empires

**Última actualización**: 2026-01-10

---

## 🎉 ¡Gracias por tu Interés!

¡Las contribuciones son bienvenidas! Este documento explica cómo puedes contribuir al proyecto New Empires.

---

## 🚀 Proceso de Contribución

### 1. Fork y Clone

```bash
# Fork del repositorio en GitHub

# Clonar tu fork
git clone https://github.com/tu-usuario/New-Empires.git
cd New-Empires
```

### 2. Crear Rama

```bash
# Crear rama para tu feature
git checkout -b feature/mi-nueva-funcionalidad

# O para un fix
git checkout -b fix/descripcion-del-bug
```

### 3. Desarrollar

- Realiza tus cambios siguiendo las convenciones del proyecto
- Prueba que todo funciona correctamente
- Verifica que no rompes funcionalidad existente

### 4. Commit

```bash
git add .
git commit -m "feat: descripción de la funcionalidad"
```

### 5. Push y Pull Request

```bash
git push origin feature/mi-nueva-funcionalidad
```

Luego abre un Pull Request en GitHub.

---

## 📝 Convenciones de Commits

### Formato
```
type: descripción breve
```

### Types
| Type | Uso |
|------|-----|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `docs` | Solo documentación |
| `style` | Formato (sin cambio de código) |
| `refactor` | Refactorización |
| `test` | Añadir tests |
| `chore` | Mantenimiento |

### Ejemplos
```bash
feat: add cavalry unit
fix: correct villager pathfinding issue
docs: update installation guide
refactor: split Game class into modules
```

---

## 💻 Guías de Código

### JavaScript

```javascript
// ✅ CORRECTO
export class MiClase {
    constructor() {
        this.propiedad = valor;
    }
    
    miMetodo() {
        // Hace algo
    }
}

// ❌ INCORRECTO
class miclase {
    constructor(){
        this.Propiedad=valor
    }
}
```

### Convenciones de Nombres

- **Archivos de clases**: PascalCase (`Villager.js`)
- **Carpetas**: camelCase (`entities`)
- **Clases**: PascalCase (`class Villager`)
- **Funciones**: camelCase (`findNearby()`)
- **Constantes**: UPPER_SNAKE_CASE (`TILE_SIZE`)

### Arquitectura

- Mantener estructura modular ES6
- Una clase principal por archivo
- Imports/exports explícitos
- Documentar funciones complejas con JSDoc

---

## 🧪 Testing

Antes de enviar tu PR:

1. **Prueba en múltiples navegadores**
   - Chrome
   - Firefox
   - Edge

2. **Verifica en consola**
   - Sin errores JavaScript
   - Sin errores de red

3. **Prueba funcionalidad**
   - Lo nuevo funciona
   - Lo existente sigue funcionando

4. **Checklist de testing**
   - [ ] Iniciar partida nueva
   - [ ] Seleccionar entidades
   - [ ] Construir/entrenar
   - [ ] Hotkeys funcionan
   - [ ] Minimapa funcional

---

## 🎯 Áreas que Necesitan Ayuda

### 🎨 Arte
- Sprites mejorados para unidades
- Assets de edificios
- Iconos personalizados

### 🔊 Audio
- Efectos de sonido adicionales
- Música de fondo
- Sonidos de ambiente

### 🤖 IA
- Mejorar comportamiento enemigo
- Pathfinding más inteligente
- Decisiones estratégicas

### 🗺️ Mapas
- Nuevos generadores procedurales
- Más variedad de biomas
- Recursos balanceados

### 📚 Documentación
- Tutoriales para nuevos jugadores
- Guías de desarrollo
- Ejemplos de código

### 🌍 Traducciones
- Internacionalización
- Traducciones a otros idiomas

---

## 📋 Pull Request Checklist

Antes de enviar tu PR, verifica:

- [ ] Código sigue convenciones del proyecto
- [ ] No hay errores en consola
- [ ] Funcionalidad probada en 2+ navegadores
- [ ] No rompe funcionalidad existente
- [ ] Commits con formato correcto
- [ ] Documentación actualizada si es necesario

---

## 🐛 Reportar Bugs

### Información Necesaria

1. **Navegador y versión**
2. **Sistema operativo**
3. **Pasos para reproducir**
4. **Comportamiento esperado**
5. **Comportamiento actual**
6. **Capturas/videos** (si aplica)
7. **Errores de consola** (si los hay)

### Template de Bug Report

```markdown
## Descripción
Descripción clara del bug.

## Pasos para Reproducir
1. Ir a '...'
2. Click en '...'
3. Ver error

## Comportamiento Esperado
Lo que debería pasar.

## Comportamiento Actual
Lo que realmente pasa.

## Entorno
- Navegador: Chrome 120
- OS: Windows 11
- Versión: 1.0.0

## Capturas
[Si aplica]
```

---

## 💡 Proponer Features

### Template

```markdown
## Descripción
¿Qué funcionalidad quieres agregar?

## Motivación
¿Por qué sería útil?

## Propuesta de Implementación
¿Cómo lo implementarías?

## Alternativas Consideradas
Otras opciones que consideraste.
```

---

## 📞 Contacto

- **Issues**: Para bugs y features
- **Discussions**: Para preguntas generales
- **Pull Requests**: Para contribuciones de código

---

**¡Gracias por contribuir a New Empires!** 🏰⚔️🌍
