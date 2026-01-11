# 💰 Sistema de Recursos - New Empires

**Última actualización**: 2026-01-10

---

## 📋 Tipos de Recursos

El juego cuenta con **4 tipos de recursos** esenciales para el desarrollo de tu civilización:

| Recurso | Icono | Descripción |
|---------|-------|-------------|
| **Madera** | 🪵 | Material de construcción básico |
| **Comida** | 🌾 | Para entrenar unidades y alimentar población |
| **Oro** | 💰 | Para tecnologías avanzadas y comercio |
| **Piedra** | 🪨 | Para edificios avanzados y defensas |

---

## 🏁 Recursos Iniciales

### Valores Base
```javascript
Madera: 200
Comida: 200
Oro:    100
Piedra: 100
Población: 3/5
```

### Modificadores por Civilización

| Civilización | Bonus Inicial |
|--------------|---------------|
| **Mongols** | +50🌾 (caballería nómada) |
| **Sumeria** | +50🌾 +25💰 (economía temprana) |
| **Romans** | +50🪨 (construcción) |
| **Vikings** | +50🪵 +50🌾 (navegación/guerra) |
| **Argentinians** | +30🪵 +30🌾 (equilibrado) |

---

## 📍 Fuentes de Recursos

### 🪵 Madera
- **Fuente**: Bosques (áreas verdes oscuras)
- **Recolector**: Aldeanos
- **Tasa base**: 1.0 unidad/segundo
- **Depósito**: Centro Urbano, Depósito de Madera

### 🌾 Comida
- **Fuentes**: 
  - Granjas (requiere construcción)
  - Animales de caza
  - Pesca (cerca del agua)
- **Recolector**: Aldeanos
- **Tasa base**: 1.0 unidad/segundo
- **Depósito**: Centro Urbano, Depósito

### 💰 Oro
- **Fuente**: Vetas de oro (en desiertos/montañas)
- **Recolector**: Aldeanos
- **Tasa base**: 0.5 unidad/segundo
- **Depósito**: Centro Urbano, Depósito
- **Alternativa**: Mercado (comercio)

### 🪨 Piedra
- **Fuente**: Canteras (en montañas/colinas)
- **Recolector**: Aldeanos
- **Tasa base**: 0.5 unidad/segundo
- **Depósito**: Centro Urbano, Depósito

---

## 🏗️ Costos de Construcción

### Edificios Económicos

| Edificio | 🪵 | 🪨 | Descripción |
|----------|----|----|-------------|
| Casa | 30 | - | +5 población |
| Depósito | 100 | - | Punto de recolección |
| Dep. Madera | 100 | - | Especializado en madera |
| Mercado | 150 | 50 | Comercio |

### Edificios Principales

| Edificio | 🪵 | 🪨 | Descripción |
|----------|----|----|-------------|
| Centro Urbano | 275 | 100 | Edificio principal |
| Cuartel | 175 | - | Entrena unidades militares |

### Edificios Culturales

| Edificio | 🪵 | 💰 | Descripción |
|----------|----|----|-------------|
| Templo | 200 | 100 | Investigación |
| Taller | 200 | 50 | Mejoras |

---

## 👥 Costos de Entrenamiento

| Unidad | 🌾 | 🪵 | 💰 | Tiempo |
|--------|----|----|----|----|
| Aldeano | 50 | - | - | 25s |
| Guerrero | 60 | - | 20 | 30s |
| Arquero | 50 | 25 | 40 | 35s |

---

## 📊 Gestión de Recursos

### Panel de Recursos (HUD)

```
┌─────────────────────────────────────────────┐
│  🪵 200   🌾 200   💰 100   🪨 100   👥 3/5 │
└─────────────────────────────────────────────┘
```

### Indicadores

- **Texto normal**: Recursos suficientes
- **Texto rojo**: Recursos bajos/insuficientes
- **Parpadeante**: Población máxima alcanzada

---

## 📈 Tasas de Recolección

### Base

| Recurso | Tasa Base | Con Depósito Cercano |
|---------|-----------|---------------------|
| Madera | 10/s | +20% eficiencia |
| Comida | 8/s | +20% eficiencia |
| Oro | 5/s | +20% eficiencia |
| Piedra | 4/s | +20% eficiencia |

### Modificadores por Civilización

| Civilización | Bonus de Recolección |
|--------------|---------------------|
| Sumeria | +15% 🌾 |
| Vikings | +10% todos |
| Mongols | +10% 🪵 (campamentos) |

### Modificadores por Tecnología

- **Herramientas Mejoradas**: +10% madera/piedra
- **Agricultura Avanzada**: +15% comida
- **Minería Eficiente**: +20% oro/piedra

---

## 🎯 Estrategias de Recursos

### Inicio de Partida

1. **Asignar aldeanos inmediatamente**:
   - 2 aldeanos a madera
   - 1 aldeano a comida

2. **Construir casas** antes de quedarse sin población

3. **Expandir economía** antes de militar

### Mid Game

1. **Diversificar recursos** según necesidad
2. **Construir depósitos** cerca de fuentes
3. **Usar mercado** para balancear

### Late Game

1. **Control de oro** es crucial
2. **Proteger aldeanos** de ataques
3. **Múltiples bases** de recolección

---

## 💡 Tips Avanzados

### Eficiencia de Recolección

- Los aldeanos pierden tiempo viajando
- Construir depósitos cerca de recursos
- Agrupar aldeanos por tipo de recurso

### Gestión de Población

- Cada casa da +5 población
- Planificar casas antes de necesitarlas
- No construir más casas de las necesarias

### Comercio en el Mercado

- Tasas de cambio varían
- Útil cuando falta un recurso específico
- No depender del comercio como fuente principal

---

## 🔧 Código Relacionado

| Componente | Archivo |
|------------|---------|
| Configuración de recursos | `js/core/constants.js` |
| Sistema de recolección | `js/entities/units/Villager.js` |
| Display de recursos | `js/core/Game.js` → `updateResourceDisplay()` |
| Costos de edificios | `js/core/constants.js` → `CONFIG.COSTS` |

---

**Ver también**: [CIVILIZATIONS.md](CIVILIZATIONS.md) | [TECH_TREE.md](TECH_TREE.md)
