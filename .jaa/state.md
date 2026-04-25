# JAA Global System State

Este archivo contiene el estado compartido entre todos los repositorios gestionados por JAA.
Los agentes pueden leer este estado para entender el contexto de otros proyectos.

## 🚀 ACTIVE MILESTONES
- [JAA] Implementación de Jerarquía de Contexto (.jaa.md global) - **COMPLETADO**
- [JAA] Sistema de Estado Global (system-state.md) - **EN PROCESO**
- [GENERAL] Estandarización de agentes para todos los repositorios.

## 📝 AGENT NOTES
- **Drillmaster (Controls & Ergonomics)**: Mejoró la ergonomía de comandos y hotkeys para reducir fricción táctica.
  - Se vinculó correctamente el botón `#closeBuildMenuBtn` al evento de cierre para asegurar que la UI no quede bloqueada y se libere la matriz de comandos.
  - Se flexibilizó el acceso al menú de construcción (hotkey "B"); ahora se abre siempre que haya al menos un aldeano seleccionado, en lugar de requerir que sea la única unidad.
  - Se implementó un sistema de "onboarding silencioso" que detecta y sugiere hotkeys contextualmente (ej. al seleccionar un aldeano por primera vez sugiere "Q/B", o "F" al seleccionar grupos militares).
  - Se corrigió la documentación `docs/sistemas/HOTKEYS.md` para que el resumen visual (QWERTY) coincida estrictamente con las implementaciones de los edificios en el código real.
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
- **Bard (UX/Feedback)**: Mejoró el feedback visual y sonoro del juego sin afectar el rendimiento.
  - Se agregó texto de daño (`createDamageText` en `EffectsManager.js`) que flota sobre las entidades al recibir ataques, centralizando el código en `Entity.js` para evitar duplicación.
  - Se implementó un nuevo efecto de partículas radiales al generarse unidades (`createSpawnEffect` en `EffectsManager.js`), integrado en `Game.js`.
  - Se afinó el diseño sonoro (`SoundManager.js`), reemplazando las ondas senoidales simples por osciladores más robustos (triangle/square) en las notificaciones de producción militar y civil.
  - Se mejoró la acústica de selección genérica de unidades, haciéndola más corta y suave para evitar fatiga auditiva.
  - Se corrigió la documentación (`docs/sistemas/PANEL_CONTROL.md`) para reflejar la estructura HTML correcta (`#commandPanel` en lugar del obsoleto `#unitControlPanel`).
