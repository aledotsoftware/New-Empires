# JAA Global System State

Este archivo contiene el estado compartido entre todos los repositorios gestionados por JAA.
Los agentes pueden leer este estado para entender el contexto de otros proyectos.

## 🚀 ACTIVE MILESTONES
- [JAA] Implementación de Jerarquía de Contexto (.jaa.md global) - **COMPLETADO**
- [JAA] Sistema de Estado Global (system-state.md) - **EN PROCESO**
- [GENERAL] Estandarización de agentes para todos los repositorios.

## 📝 AGENT NOTES
- **Lorekeeper (Civilizations & Content)**: Completó la auditoría y expansión de las civilizaciones, lore, semillas de campaña y datos faltantes.
  - Se añadieron `primaryColor` y `secondaryColor` faltantes a 9 civilizaciones (Babilonia, Bizancio, Califato, Egipto, Grecia, Mongoles, Persia, España y Sumeria) garantizando coherencia en la UI y colores de equipo (`assets/civilization/*.json`).
  - Se verificó programáticamente que todos los `icon` referenciados, los bloques de `lore` y las `campaignSeeds` existen en todas las civilizaciones, asegurando que están listas para futuras integraciones de contenido y campañas.

- **Overseer (Economy & Macro)**: Completó mejoras en la economía, producción y flujo macro del RTS.
  - Se corrigió un exploit donde encolar unidades en múltiples edificios permitía evadir el límite máximo de población; ahora `canAddPopulation` evalúa la suma total de colas del jugador a nivel global (`Game.js`).
  - Se optimizó y redujo la fricción en el comportamiento de recolección de los aldeanos. Si un nodo de recursos se agota y no hay otros cerca, los aldeanos que tengan recursos en su inventario (`carryAmount > 0`) automáticamente irán a depositarlos en lugar de quedarse inactivos (`IDLE`) con las manos llenas (`Villager.js`).
  - Se expandió la lista de estadísticas permitidas (`ALLOWED_STATS`) en el `TechManager.js` para admitir variables críticas como `maxCarry` y los multiplicadores de velocidad de recolección, posibilitando a las tecnologías modificar correctamente la eficiencia económica de los aldeanos.
  - Se optimizó el core loop de modificación de estadísticas aplicando operadores ternarios inline en reemplazo de `Math.abs`, siguiendo las directrices de eficiencia para V8.
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
  - Se modificaron los umbrales de elevación en `getTerrainFromNoise` (`ProceduralMapGenerator.js`) para expandir áreas abiertas, reduciendo montañas (umbral 0.80), colinas (0.65) y agua (0.20), lo que minimiza cuellos de botella naturales y facilita la navegación.
  - Se reemplazó el algoritmo aleatorio de `placeCluster` por un espiral cuadrado denso, garantizando que los clústeres de recursos (como oro y piedra) se generen como bloques compactos y contiguos, mejorando la legibilidad y el pathfinding de las unidades.
  - Se endureció la heurística de cuellos de botella en `isValidResourceCenter`, agregando `forest` a los terrenos evaluados y aumentando el umbral de rechazo a 20 tiles en un área 7x7, lo que previene que los recursos se generen atrapados entre bosques y montañas.
  - Se redujo drásticamente el "visual clutter" en `TerrainDecor.js` disminuyendo la probabilidad base de aparición de decoraciones menores (flores, hojas, etc.) del 5% al 2%, mejorando el rendimiento de renderizado y la lectura táctica del terreno.
- **Bard (UX/Feedback)**: Mejoró el feedback visual y sonoro del juego sin afectar el rendimiento.
  - Se agregó texto de daño (`createDamageText` en `EffectsManager.js`) que flota sobre las entidades al recibir ataques, centralizando el código en `Entity.js` para evitar duplicación.
  - Se implementó un nuevo efecto de partículas radiales al generarse unidades (`createSpawnEffect` en `EffectsManager.js`), integrado en `Game.js`.
  - Se afinó el diseño sonoro (`SoundManager.js`), reemplazando las ondas senoidales simples por osciladores más robustos (triangle/square) en las notificaciones de producción militar y civil.
  - Se mejoró la acústica de selección genérica de unidades, haciéndola más corta y suave para evitar fatiga auditiva.
  - Se corrigió la documentación (`docs/sistemas/PANEL_CONTROL.md`) para reflejar la estructura HTML correcta (`#commandPanel` en lugar del obsoleto `#unitControlPanel`).
  - Se implementaron sonidos sintetizados de error (`playError()`) en `SoundManager.js` que se activan automáticamente siempre que se usa `showNotification(..., 'error')` en `Game.js` para proveer feedback auditivo robusto en acciones denegadas.
  - Se agregó un sintetizador de clic (`playClick()`) como fallback para botones y acciones UI que dependían de un asset no cargado.
- **Sentinel (Stability & Save/Load)**: Mejoró la fiabilidad del sistema de guardado y carga.
  - Se corrigió la omisión de `enemyCivilizationId` en `SaveManager.js` y `Game.js` durante la serialización, validación y carga del estado del juego, impidiendo que el oponente desapareciera al cargar una partida.
  - Se actualizó la documentación de `SAVE_SYSTEM.md` para reflejar que la "Carga completa de partida guardada" ya está implementada y es funcional.
- **Bard (UX/Feedback) [Update]**: Afinó el feedback sonoro y visual táctico en el juego sin dañar FPS.
  - El sonido `playError()` y la animación CSS `.shake` ahora se activan correctamente no solo al hacer click en acciones deshabilitadas sino también al accionar sus correspondientes hotkeys en el teclado.
  - La posición del texto de daño flotante fue corregida para que flote 10 pixeles más arriba dependiendo del tamaño de la entidad afectada, incrementando legibilidad en combates cerrados (`Entity.js`).
  - Las partículas de flechas incendiarias usan un abanico de colores y luminosidades de fuego más alto para que el proyectil resalte más.
  - Los tonos sintetizados en `SoundManager.js` fueron revisados para un `playError` más contundente usando osciladores cuadrados en secuencia en lugar de tonos dentados.
