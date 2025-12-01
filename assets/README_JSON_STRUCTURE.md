# 🗂️ Sistema de Archivos JSON - Estructura Modular

## Descripción General

Este sistema permite definir tecnologías, edificios y unidades de forma modular mediante archivos JSON. Cada civilización puede personalizar estos elementos base con sus propios nombres, iconos y bonificaciones únicas.

## Estructura de Carpetas

```
assets/
├── technologies/
│   ├── base_technologies.json    # Tecnologías base del juego
│   ├── base_buildings.json        # Edificios base del juego
│   └── base_units.json            # Unidades base del juego
│
└── civilization/
    ├── mongols.json               # Personalización mongol
    ├── mesopotamia.json           # Personalización mesopotámica
    └── [otras_civilizaciones].json
```

## 📜 base_technologies.json

Define todas las tecnologías base del juego con:

### Estructura:
```json
{
  "metadata": {...},
  "ages": {
    "1": { "name": "...", "period": "...", "era": "..." }
  },
  "categories": {...},
  "technologies": [
    {
      "id": "uniqueId",
      "baseName": "Nombre Base",
      "baseIcon": "🎯",
      "category": "CATEGORY_ID",
      "age": 1,
      "baseDescription": "Descripción base",
      "cost": { "food": 100, "wood": 50 },
      "researchTime": 30,
      "building": "buildingId",
      "prerequisites": ["techId1", "techId2"],
      "effects": {
        "gatherRates": { "wood": 1.2 },
        "unitStats": {
          "unitType": { "maxHp": 10, "attackDamage": 5 }
        }
      }
    }
  ]
}
```

### Propiedades de Effects:
- **gatherRates**: Multiplicadores de recolección (ej: `{ "food": 1.25 }`)
- **unitStats**: Modificadores de estadísticas de unidades
- **buildingStats**: Modificadores de edificios
- **maxStorage**: Multiplicador de capacidad de almacenamiento
- **custom**: Efectos personalizados

## 🏗️ base_buildings.json

Define todos los edificios base del juego.

### Estructura:
```json
{
  "buildings": [
    {
      "id": "buildingId",
      "baseName": "Nombre Base",
      "baseIcon": "🏠",
      "baseDescription": "Descripción base",
      "type": "housing|military|economy|culture",
      "cost": { "wood": 100, "stone": 50 },
      "buildTime": 30,
      "maxHp": 500,
      "size": 30,
      "populationProvided": 5,
      "availableFromAge": 1,
      "canProduce": ["unit1", "unit2"],
      "canResearch": ["techCategory"]
    }
  ]
}
```

### Tipos de Edificios:
- **housing**: Proporciona población
- **military**: Produce unidades militares
- **economy**: Mejora economía
- **culture**: Avances culturales

## 👥 base_units.json

Define todas las unidades base del juego.

### Estructura:
```json
{
  "units": [
    {
      "id": "unitId",
      "baseName": "Nombre Base",
      "baseIcon": "⚔️",
      "baseDescription": "Descripción base",
      "type": "civilian|melee|ranged|cavalry|support",
      "cost": { "food": 60, "gold": 20 },
      "trainTime": 15,
      "maxHp": 100,
      "attackDamage": 10,
      "attackSpeed": 1.2,
      "attackRange": 50,
      "speed": 50,
      "lineOfSight": 5,
      "populationCost": 1,
      "availableFromAge": 3,
      "abilities": ["attack", "gather"],
      "bonusVs": { "cavalry": 2.0 }
    }
  ]
}
```

### Habilidades Disponibles:
- **attack**: Puede atacar
- **gather**: Puede recolectar recursos
- **build**: Puede construir edificios
- **heal**: Puede curar aliados
- **convert**: Puede convertir enemigos
- **scout**: Exploración mejorada
- **trade**: Puede comerciar
- **charge**: Carga de caballería

## 🏛️ Archivos de Civilización

Cada civilización tiene su propio JSON que puede:

### 1. **Sobrescribir Tecnologías**
```json
{
  "technologyOverrides": {
    "techId": {
      "name": "Nombre Personalizado",
      "icon": "🎯",
      "description": "Descripción personalizada"
    }
  }
}
```

### 2. **Sobrescribir Edificios**
```json
{
  "buildingOverrides": {
    "house": {
      "name": "Yurta",
      "icon": "⛺",
      "description": "Vivienda nómada"
    }
  }
}
```

### 3. **Sobrescribir Unidades**
```json
{
  "unitOverrides": {
    "warrior": {
      "name": "Guerrero Mongol",
      "icon": "🗡️",
      "description": "Guerrero de las estepas"
    }
  }
}
```

### 4. **Tecnologías Únicas**
```json
{
  "uniqueTechnologies": [
    {
      "id": "uniqueTechId",
      "name": "Tecnología Única",
      "icon": "✨",
      "category": "MILITARY",
      "age": 20,
      "description": "Exclusiva de esta civilización",
      "cost": { "food": 300, "gold": 200 },
      "researchTime": 40,
      "building": "barracks",
      "prerequisites": ["otherTech"],
      "effects": {...}
    }
  ]
}
```

### 5. **Unidades Únicas**
```json
{
  "uniqueUnit": {
    "id": "mangudai",
    "name": "Mangudai",
    "icon": "🏹",
    "baseUnit": "archer",
    "age": 18,
    "bonuses": {
      "attackDamage": 1.3,
      "attackSpeed": 1.2
    }
  }
}
```

### 6. **Bonificaciones de Civilización**
```json
{
  "bonuses": {
    "unitSpeed": 1.15,
    "buildSpeed": 1.20,
    "gatherSpeed": 1.10,
    "buildingHp": 1.15,
    "unitAttack": 1.10,
    "cavalryAttack": 1.20,
    "agricultureBonus": 1.25
  }
}
```

## 🎮 Ejemplo de Uso

### Casa Base → Personalizaciones por Civilización

**Base (base_buildings.json):**
```json
{
  "id": "house",
  "baseName": "Casa",
  "baseIcon": "🏠",
  "cost": { "wood": 30 }
}
```

**Mongoles (mongols.json):**
```json
{
  "buildingOverrides": {
    "house": {
      "name": "Yurta",
      "icon": "⛺"
    }
  }
}
```

**Mesopotamia (mesopotamia.json):**
```json
{
  "buildingOverrides": {
    "house": {
      "name": "Casa de Adobe",
      "icon": "🏘️"
    }
  }
}
```

**Era Moderna:**
```json
{
  "buildingOverrides": {
    "house": {
      "name": "Apartamento",
      "icon": "🏢"
    }
  }
}
```

## 🔄 Cómo Cargar los Datos

```javascript
// 1. Cargar tecnologías base
const baseTechs = await fetch('assets/technologies/base_technologies.json');
const techData = await baseTechs.json();

// 2. Cargar civilización específica
const civData = await fetch('assets/civilization/mongols.json');
const mongols = await civData.json();

// 3. Aplicar sobrescrituras
const finalTech = applyOverrides(techData.technologies, mongols.technologyOverrides);
```

## 📝 Mejores Prácticas

1. **IDs únicos**: Siempre usa IDs consistentes entre archivos
2. **Nombres base neutrales**: Los nombres base deben ser genéricos
3. **Períodos históricos**: Respeta las edades históricas para tecnologías
4. **Balance**: Mantén bonificaciones equilibradas (generalmente 1.1 - 1.3)
5. **Documentación**: Describe claramente cada efecto personalizado

## 🚀 Próximos Pasos

- [ ] Implementar loader de JSON en el juego
- [ ] Sistema de merge de sobrescrituras
- [ ] Validación de JSON
- [ ] Editor visual de civilizaciones
- [ ] Sistema de mods
