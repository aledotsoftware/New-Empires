# Especificación de Reglas de Negocio: Árbol de Tecnologías y Civilizaciones (Data-Driven)

## Dominio
**Civilizaciones, Esquemas Data-Driven, 30 Edades Históricas y Efectos Globales**

## 1. Civilizaciones y Esquema Data-Driven (`civ-schema.json`)
- **Desacoplamiento Total**: Las civilizaciones no están prefijadas en código. Toda civilización se carga desde un catálogo JSON estructurado según `civ-schema.json`.
- **Bonificaciones Pasivas**: Cada civilización define sus bonificaciones pasivas (`passiveBonuses`), las cuales se aplican automáticamente a las entidades objetivo (`targetType`) desde el instante de inicio de la partida.
- **Unidades y Estructuras Iniciales**: `startingUnits` y `startingBuildings` determinan la composición inicial del jugador en el mapa según la data de la civilización.

## 2. Estructura de Edades Tecnológicas y Esquema de Tecnologías (`tech-schema.json`)
- El árbol se divide en **30 edades históricas** progresivas (desde el *Paleolítico* hasta la *Era Moderna*).
- Toda tecnología debe cumplir estrictamente con la especificación `tech-schema.json`.
- Avanzar de edad requiere:
  1. Haber investigado las tecnologías clave de la edad actual.
  2. Cumplir con los costos de recursos exigidos (`wood`, `food`, `gold`, `stone`).
  3. Contar con las estructuras y tecnologías prerrequisito (`prerequisites`) en estado completado.

## 3. Ramas de Investigación y Efectos (`EffectsManager`)
Las investigaciones se agrupan en 7 categorías:
1. **Herramientas (`tools`)**: Incrementa velocidad de recolección de recursos.
2. **Agricultura (`agriculture`)**: Incrementa producción de comida y capacidad de carga de aldeanos.
3. **Economía (`economy`)**: Reduce costos de mercado y acelera el comercio.
4. **Arquitectura (`architecture`)**: Incrementa HP de edificios y velocidad de construcción.
5. **Militar (`military`)**: Aumenta ataque, alcance y velocidad de ataque de unidades de combate.
6. **Defensa (`defense`)**: Aumenta armadura y resistencia al daño de unidades y estructuras.
7. **Cultura (`culture`)**: Aumenta velocidad de conversión/curación de sacerdotes y visión global del mapa.

## 4. Aplicación de Efectos Acumulativos
- Los efectos investigados se aplican dinámicamente sobre todas las unidades presentes y futuras mediante `EffectsManager`.
- Los modificadores pueden ser aditivos (`"modifierType": "add"`) o multiplicativos (`"modifierType": "multiply"`), acumulándose en orden secuencial de investigación.
