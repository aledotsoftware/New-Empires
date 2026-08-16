# Especificación de Reglas de Negocio: Economía y Producción (Data-Driven)

## Dominio
**Gestión de Recursos, Recolección, Capacidad Poblacional y Colas de Producción**

## 1. Tipos de Recursos y Depósitos
- El sistema gestiona 4 recursos primarios:
  - **Madera (`wood`)**: Recolectada de árboles/bosques. Se deposita en depósitos configurados con la etiqueta `storage_wood` o `storage_all`.
  - **Comida (`food`)**: Recolectada de cultivos/arbustos/pesca. Se deposita en depósitos con la etiqueta `storage_food` o `storage_all`.
  - **Oro (`gold`)**: Recolectado de minas de oro. Se deposita en depósitos con la etiqueta `storage_gold` or `storage_all`.
  - **Piedra (`stone`)**: Recolectada de canteras/minas de piedra. Se deposita en depósitos con la etiqueta `storage_stone` o `storage_all`.

## 2. Lógica de Recolección (Unidades con `canGather === true`)
- **Tasas Base de Recolección (por segundo)**:
  - Madera: 10 u/s
  - Comida: 8 u/s
  - Oro: 5 u/s
  - Piedra: 4 u/s
- **Capacidad Máxima de Carga Base**: 10 unidades de recurso por unidad recolectora.
- **Flujo de Trabajo y Tiempo de Extracción**:
  1. Estado `moving_to_resource`: La unidad camina hacia el nodo de recurso objetivo.
  2. Estado `gathering` (**Tiempo de Trabajo Continuo en el Nodo**): Al llegar a rango de interacción (<30px), la unidad **permanece en el nodo trabajando**. Cada 1.0 segundo acumula recurso en su inventario según la tasa (`tasaBase * multiplicadores`). La unidad se mantiene en el nodo picando/talando/cosechando hasta llenar su inventario (`carryAmount >= maxCarry`) o agotar el recurso.
  3. Estado `carrying` / `returning_resource`: Una vez llena su capacidad máxima (10 unidades), busca el edificio de depósito adecuado más cercano y camina hacia él.
  4. Estado `deposit`: Al llegar al depósito, acredita el botín al saldo global del jugador, vacía su inventario y regresa automáticamente a trabajar al nodo de recurso.


## 3. Población y Viviendas
- **Población Inicial**: Configurable por civilización / mapa.
- **Capacidad de Población Inicial**: Configurable por civilización / mapa.
- **Incremento por Vivienda**: Edificios etiquetados como `population_housing` aumentan la capacidad máxima en la cantidad especificada en su metadata.
- **Límite Absoluto de Población**: Ninguna partida permite superar los 200 habitantes.
- **Restricción de Entrenamiento**: Intentar entrenar una unidad cuando la población actual es igual o superior a la capacidad máxima debe ser bloqueado con un mensaje de alerta sonoro y visual.

## 4. Colas de Producción Data-Driven y Reembolsos
- **Unidades entrenables por Edificio**: Se determinan dinámicamente consultando las definiciones JSON de la civilización activa que especifiquen dicho edificio como su `trainedAtBuilding` o en la propiedad `functions.trainsUnits` del edificio (`building-schema.json`).
- **Comportamiento de la Cola**:
  - Cada edificio puede encolar hasta 5 elementos en secuencia.
  - Al encolar una unidad, los costos definidos en su propiedad `cost` se deducen inmediatamente del saldo global del jugador.
  - Si el entrenamiento se cancela manualmente antes de finalizar, el sistema reembolsa el 100% del costo especificado en el JSON mediante el módulo `RefundManager`.

## 5. Definición Data-Driven de Edificios y Recurso Gráfico
- **Esquema Obligatorio (`building-schema.json`)**: Todos los edificios, sus dimensiones (`size`), costos (`cost`), estadísticas base y funciones (`functions`) se leen dinámicamente desde el catálogo JSON de la civilización activa.
- **Recurso Gráfico Automático por Nombre**: Por regla de arquitectura, todo edificio posee implícitamente una imagen/icono asociada con su mismo nombre (`assets/icons/{nombre}.png`, por ejemplo `casa` \(\rightarrow\) `assets/icons/casa.png`, `cuartel` \(\rightarrow\) `assets/icons/cuartel.png`). La propiedad `icon` solo se especifica si se requiere sobreescribir dicha ruta por defecto.

