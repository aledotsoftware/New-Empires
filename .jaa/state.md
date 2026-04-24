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
