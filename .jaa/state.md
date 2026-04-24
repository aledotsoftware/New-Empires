# JAA Global System State

Este archivo contiene el estado compartido entre todos los repositorios gestionados por JAA.
Los agentes pueden leer este estado para entender el contexto de otros proyectos.

## 🚀 ACTIVE MILESTONES
- [JAA] Implementación de Jerarquía de Contexto (.jaa.md global) - **COMPLETADO**
- [JAA] Sistema de Estado Global (system-state.md) - **EN PROCESO**
- [GENERAL] Estandarización de agentes para todos los repositorios.

## 📝 AGENT NOTES
- **Vision Agent**: Reportando progreso en el diseño premium del dashboard.
- **ErrorGuardian**: Monitoreando logs de error en producción.
- **Strategist (Combat & AI)**: Completó mejoras en la IA de combate y toma de decisiones tácticas.
  - Se incrementaron los rangos de ataque de unidades cuerpo a cuerpo (60-65) y arqueros (130) para mitigar aglomeraciones perjudiciales al pathfinding.
  - Se calibraron las penalizaciones por distancia en la evaluación de objetivos (`evaluateTargetScore`), manteniendo la tenacidad sobre el objetivo actual pero evitando persecuciones infinitas a enemigos distantes.
  - Se ajustó el multiplicador de contraunidades (ej. piqueros vs caballería, caballería vs arqueros) forzando que prioricen sus presas tácticas naturales.
  - El kiting de los arqueros se perfeccionó, activándose al 80% de su rango máximo en lugar del ~60%, haciéndolos más efectivos defendiendo sus posiciones y penalizando perseguir a enemigos.
  - El sistema de formaciones (`FormationManager.js`) se actualizó para situar consistentemente la caballería al frente/flancos, infantería en el medio y tiradores/civiles detrás.
  - El espaciado de formaciones ahora escala dinámicamente según el tamaño del ejército (`spacing * (1.25 + (unidades / 50))`) para prevenir saturación espacial en grupos gigantes. Se actualizó `docs/sistemas/FORMATIONS.md` para reflejar esto.
- **Cartographer (Map Generation)**: Completó mejoras en la distribución de terrenos y recursos procedurales.
  - Se corrigió el algoritmo de "Balanced Starts" (`generateBalancedStarts`) ajustando los pesos de espacio abierto y distancia, limitando el puntaje de distancia y priorizando una zona libre (10x vs 50x multiplier) para evitar spawn encajonado en bordes de mapa.
  - Se mejoró la recolección de recursos en `isValidResourceCenter`. Se agregaron márgenes estrictos (4 tiles) hacia el borde del mapa para que los recursos siempre sean accesibles y se aumentó el espaciamiento mínimo entre cúmulos de recursos (de 5 a 8 tiles) para evitar bloqueos por acumulación.
  - Se agregó heurística de "choke-point" (cuello de botella) para impedir la aparición de minas de oro o piedra en áreas excesivamente estrechas rodeadas de agua o montaña.
  - Se reescribió `smoothTerrain` en dos pases (2-pass smoothing): El primero borra montañas/bosques aislados, y el segundo identifica tiles de terreno transitable (pastizal/tierra) encajonados (1 solo tile) y rodeados de terrenos impasables, eliminando zonas inútiles que antes generaban dead-ends para el A*.
