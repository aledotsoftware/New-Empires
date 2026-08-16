# Especificación de Reglas de Negocio: Combate y Formaciones (Data-Driven)

## Dominio
**Unidades Dinámicas, Matriz de Combate por Tags, Micro-IA Genérica y Formaciones**

## 1. Carga Dinámica de Unidades (Data-Driven Architecture)
- **Desacoplamiento de Tipos Hardcodeados**: El motor de juego no posee clases ni tipos de unidades prefijados en código.
- **Catálogo por Civilización**: Las unidades disponibles, sus estadísticas base (`baseStats`), etiquetas (`tags`) y comportamientos (`behaviors`) se leen dinámicamente desde archivos JSON asociados a la civilización activa, los cuales deben cumplir con la especificación `unit-schema.json`.
- **Modificadores de Atributos**: Todas las estadísticas (`maxHp`, `attackDamage`, `attackRange`, `movementSpeed`, `armor`) se instancian desde la data del JSON y pueden ser alteradas dinámicamente en runtime por la matriz de tecnologías y efectos globales.
- **Recurso Gráfico Automático por Nombre**: Por arquitectura, toda unidad posee implícitamente una imagen/icono asociada con su mismo nombre (`assets/icons/{nombre}.png`, por ejemplo `aldeano` \(\rightarrow\) `assets/icons/aldeano.png`). La propiedad `icon` solo se utiliza en el JSON si se requiere sobreescribir expresamente dicha ruta por defecto.


## 2. Matriz de Combate por Intersección de Tags
El cálculo del daño aplicado entre un atacante y un defensor no utiliza nombres fijados de unidades, sino que evalúa dinámicamente las etiquetas cruzadas:

$$\text{Daño Final} = \max\left(1, (\text{Daño Base} \times \text{Multiplicador de Tags}) - \text{Armadura Defensora}\right)$$

### Reglas de Evaluación de Tags:
- El atacante posee un arreglo `tags.attack_tags` (ej. `["anti_cavalry", "melee"]`).
- El defensor posee un arreglo `tags.armor_tags` (ej. `["heavy_cavalry", "mounted"]`).
- El motor consulta la tabla global de bonificaciones `TAG_COMBAT_MULTIPLIERS[attack_tag][armor_tag]` para calcular el multiplicador combinado:
  - `anti_cavalry` vs `cavalry_armor`: Multiplicador \(1.50\) (+50% daño).
  - `piercing` vs `unarmored`: Multiplicador \(1.50\) (+50% daño).
  - `piercing` vs `heavy_armor`: Multiplicador \(0.80\) (-20% daño).
  - `siege_damage` vs `building_structure`: Multiplicador \(1.50\) (+50% daño).
  - `unarmed_gatherer` vs `building_structure`: Multiplicador \(0.50\) (-50% daño).

## 3. Micro-IA de Combate Genérica (Impulsada por Data)

### 3.1. Priorización Dinámica de Objetivos (`evaluateTargetScore`)
- La evaluación de objetivos para la IA de combate no comprueba clases de unidades, sino que consulta la matriz `behaviors.targetPriorities` de la data de la unidad atacante contra los `armor_tags` del enemigo objetivo.
- **Cálculo de Puntuación**:
  - Puntuación Base = Valor de amenaza del enemigo.
  - Bono por Tag = `targetPriorities[enemy.primaryArmorTag] || 0`.
  - Penalización por Distancia = `distSq / 15` (si el objetivo está distante).
  - Bono por Persistencia = +1000 si el objetivo actual ya está dentro del rango de ataque.

### 3.2. Maniobras Genéricas de Kiting / Hit & Run
- **Disparador de Kiting**: Se activa exclusivamente si la unidad posee `behaviors.canKite === true` y `behaviors.attackType === "ranged"`.
- **Distancia de Huida**: Se gatilla cuando la distancia a una unidad enemiga viva con `attackType === "melee"` desciende a un valor menor que:
  $$\text{Distancia Umbral} = \text{attackRangeSq} \times \text{behaviors.kiteDistanceRatio}$$
- **Vector de Escape**: La unidad calcula el vector opuesto al objetivo agresor y se desplaza una distancia de evasión (50px). Si el enfriamiento de ataque (`attackCooldown`) expira durante el desplazamiento y el enemigo sigue a alcance, la unidad efectúa el disparo sin cancelar su marcha de huida.

### 3.3. Movimiento Explícito vs Ataque en Ruta (`explicitTarget`)
- **Orden de Mover Estándar / Retirada**: Marca `explicitTarget = true`. La unidad prioriza marchar a las coordenadas de destino ignorando agresiones dinámicas en ruta.
- **Orden de Ataque-Move**: Marca `explicitTarget = false`. La unidad avanza hacia las coordenadas de destino pero entabla combate al detectar enemigos compatibles con sus prioridades de adquisición.

## 4. Formaciones Tácticas Genéricas
Las 7 formaciones tácticas (Línea, Columna, Cuadro, Cuña, Círculo, Dispersa y Flancos) funcionan genéricamente para cualquier colección de unidades de la grilla espacial:
- Las unidades con `behaviors.attackType === "melee"` o `tags.armor_tags` pesadas son posicionadas en la vanguardia.
- Las unidades con `behaviors.canKite === true`, `attackType === "ranged"` o `canHeal === true` son posicionadas en la retaguardia o centro protegido.
