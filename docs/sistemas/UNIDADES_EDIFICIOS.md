# 🏛️ Sistema de Unidades y Edificios - New Empires

**Última actualización**: 2026-01-10

---

## 👥 Unidades

### Clasificación

| Tipo | Descripción |
|------|-------------|
| **Civiles** | Recolectan recursos, construyen |
| **Melee** | Combate cuerpo a cuerpo |
| **Ranged** | Combate a distancia |

---

## 👨‍🌾 Aldeano (Villager)

El corazón de tu economía.

### Estadísticas

| Propiedad | Valor |
|-----------|---------|
| HP | 50 |
| Velocidad | 50 px/s |
| Daño | 3 |
| Costo | 50🌾 |
| Tiempo de entrenamiento | 25s |
| Capacidad de carga | 10 unidades |

### Habilidades

- ✅ Recolectar madera, comida, oro, piedra
- ✅ Construir edificios
- ✅ Reparar edificios (futuro)
- ❌ No puede atacar eficientemente

### Estados

```
IDLE → MOVING → GATHERING → CARRYING → DEPOSITING
                    ↓
              BUILDING (si construye)
```

| Estado | Descripción |
|--------|-------------|
| `IDLE` | Sin trabajo asignado |
| `MOVING` | Desplazándose a destino |
| `GATHERING` | Recolectando recurso |
| `CARRYING` | Llevando recursos |
| `BUILDING` | Construyendo edificio |

---

## ⚔️ Guerrero (Warrior)

Unidad de combate cuerpo a cuerpo básica.

### Estadísticas

| Propiedad | Valor |
|-----------|-------|
| HP | 100 |
| Ataque | 10 |
| Velocidad de ataque | 1.2s |
| Rango de ataque | Melee (contacto) |
| Velocidad | 70 px/s |
| Costo | 60🌾 + 20💰 |
| Tiempo de entrenamiento | 30s |

### Habilidades

- ✅ Atacar unidades enemigas
- ✅ Atacar edificios enemigos
- ✅ Patrullar (futuro)
- ✅ Guardia (futuro)

### Uso Estratégico

- Ideal contra otras unidades melee
- Bueno para asaltar bases enemigas
- Vulnerable a arqueros en grupos

---

## 🏹 Arquero (Archer)

Unidad de combate a distancia.

### Estadísticas

| Propiedad | Valor |
|-----------|-------|
| HP | 60 |
| Ataque | 8 |
| Velocidad de ataque | 1.5s |
| Rango de ataque | 100 px |
| Velocidad | 75 px/s |
| Costo | 50🌾 + 25💰 |
| Tiempo de entrenamiento | 35s |

### Habilidades

- ✅ Atacar desde distancia
- ✅ Bonificación en bosques (+10% defensa)
- ✅ Bonificación en colinas (+20% rango)

### Uso Estratégico

- Efectivo contra unidades melee
- Débil en combate cuerpo a cuerpo
- Mejor en grupos con protección

---

## 🏗️ Edificios

### Clasificación

| Tipo | Color | Descripción |
|------|-------|-------------|
| **Económicos** | 🟢 | Producción de recursos |
| **Militares** | 🔴 | Entrenamiento de unidades |
| **Culturales** | 🟡 | Investigación y mejoras |

---

## 🏰 Centro Urbano (Town Center)

Edificio principal de la civilización.

### Estadísticas

| Propiedad | Valor |
|-----------|-------|
| HP | 2000 |
| Tamaño | 60px (5x5 tiles) |
| Costo | 275🪵 + 100🪨 |
| Puede entrenar | Aldeanos |

### Funciones

- ✅ Punto de spawn inicial
- ✅ Entrenar aldeanos
- ✅ Punto de depósito de recursos
- ✅ Indica territorio controlado

---

## 🏠 Casa (House)

Aumenta el límite de población.

### Estadísticas

| Propiedad | Valor |
|-----------|-------|
| HP | 500 |
| Tamaño | 30px (2x2 tiles) |
| Costo | 30🪵 |
| Población | +5 |

### Notas

- Construir antes de alcanzar límite
- Una casa por cada 5 unidades necesarias

---

## ⚔️ Cuartel (Barracks)

Entrena unidades militares.

### Estadísticas

| Propiedad | Valor |
|-----------|-------|
| HP | 1200 |
| Tamaño | 50px (4x4 tiles) |
| Costo | 175🪵 |
| Puede entrenar | Guerrero, Arquero |

### Cola de Entrenamiento

- Pueden encolarse múltiples unidades
- Producción secuencial
- Cancelar reembolsa 50% de recursos

---

## 📦 Depósito (Storage)

Punto de entrega de recursos.

### Estadísticas

| Propiedad | Valor |
|-----------|-------|
| HP | 800 |
| Tamaño | 40px (3x3 tiles) |
| Costo | 100🪵 |

### Función

- Reduce distancia de viaje de aldeanos
- Construir cerca de recursos
- Aumenta eficiencia de recolección

---

## 🌲 Depósito de Madera (Lumber Camp)

Especializado en madera.

### Estadísticas

| Propiedad | Valor |
|-----------|-------|
| HP | 600 |
| Tamaño | 35px (3x3 tiles) |
| Costo | 100🪵 |

### Bonificación

- +10% velocidad de depósito de madera
- Ideal junto a bosques grandes

---

## 🏪 Mercado (Market)

Comercio de recursos.

### Estadísticas

| Propiedad | Valor |
|-----------|-------|
| HP | 800 |
| Tamaño | 50px (4x4 tiles) |
| Costo | 150🪵 + 50🪨 |

### Funciones

- Intercambiar recursos
- Tasas de cambio dinámicas
- Comercio con aliados (futuro)

---

## ⛪ Templo (Temple)

Centro de investigación cultural.

### Estadísticas

| Propiedad | Valor |
|-----------|-------|
| HP | 1000 |
| Tamaño | 50px (4x4 tiles) |
| Costo | 200🪵 + 100💰 |

### Funciones

- Investigar tecnologías culturales
- Entrenar monjes (futuro)
- Curar unidades (futuro)

---

## 🔨 Taller (Workshop)

Mejoras de unidades y equipamiento.

### Estadísticas

| Propiedad | Valor |
|-----------|-------|
| HP | 900 |
| Tamaño | 45px (3x3 tiles) |
| Costo | 200🪵 + 50🪨 |

### Funciones

- Mejoras de armadura
- Mejoras de ataque
- Mejoras de velocidad

---

## 📊 Comparativa de Edificios

| Edificio | HP | 🪵 | 🪨 | Función |
|----------|----|----|----|----|
| Centro Urbano | 2000 | 275 | 100 | Principal |
| Casa | 500 | 30 | - | +5 población |
| Cuartel | 1200 | 175 | - | Militar |
| Depósito | 800 | 100 | - | Recursos |
| Mercado | 800 | 150 | 50 | Comercio |
| Templo | 1000 | 200 | - | Cultura (100💰) |
| Taller | 900 | 200 | 50 | Mejoras |

---

## 🔧 Código Relacionado

| Componente | Archivo |
|------------|---------|
| Clase base Entity | `js/entities/Entity.js` |
| Clase base Unit | `js/entities/Unit.js` |
| Clase base Building | `js/entities/Building.js` |
| Aldeano | `js/entities/units/Villager.js` |
| Guerrero | `js/entities/units/Warrior.js` |
| Arquero | `js/entities/units/Archer.js` |
| Centro Urbano | `js/entities/buildings/TownCenter.js` |

---

**Ver también**: [RECURSOS.md](RECURSOS.md) | [TERRAIN_SYSTEM.md](TERRAIN_SYSTEM.md) | [CIVILIZATIONS.md](CIVILIZATIONS.md)
