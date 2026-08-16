# Especificación de Reglas de Negocio: Arquitectura Multijugador

## Dominio
**Sincronización en Tiempo Real, Salas de Juego, Lockstep y Mitigación de Desync**

## 1. Arquitectura de Simulación (Lockstep / Determinismo)
- **Modelo de Simulación**: La partida avanza por ticks de simulación discretos (20 ticks por segundo / 50ms por tick).
- **Ejecución Determinista**: Los clientes ejecutan exactamente la misma semilla del mapa (`mapSeed`) y la misma lógica de física e IA.
- **Transmisión de Comandos**: Las acciones del usuario (mover, atacar, construir) no modifican el estado local de forma inmediata en la simulación compartida; se encapsulan como un `PlayerCommand` con el `tick` futuro de ejecución objetivo.
- **Buffer de Latencia Dinámico ($L$)**:
  $$L = \left\lceil \frac{\text{ping}}{2} \right\rceil + \text{jitter}$$
  El retraso de ejecución del comando se ajusta automáticamente según la latencia de la red.

## 2. Gestión de Salas (Lobby & Matchmaking)
- **Capacidad de Sala**: De 2 a 8 jugadores simultáneos por sala.
- **Sincronización de Selección**: Todos los jugadores deben confirmar su civilización y color antes de marcar el estado `READY`.
- **Inicio de Partida**: La simulación inicia únicamente cuando el 100% de los jugadores en la sala están en estado `READY` y han cargado los activos estáticos del mapa.

## 3. Manejo de Latencia, Heartbeat y Reconexión
- **Monitoreo Heartbeat**: Los clientes envían un evento `HeartbeatPing` cada 2 segundos para calcular el RTT (*Round Trip Time*) y ajustar el buffer de comandos.
- **Detección de Desincronización (Desync)**:
  - Cada 100 ticks (~5 segundos), los clientes calculan un checksum hash CRC32 del estado global de las entidades vivas y recursos.
  - Los hashes se transmiten al servidor en `GameStateDelta`. Si se detecta una discrepancia entre clientes, la partida emite un evento `DesyncAlert`.
- **Reconexión**: Un jugador desconectado dispone de un tiempo de gracia de 60 segundos para reconectarse. El servidor le transmite un snapshot de estado completo para reanudar la simulación en el tick actual.
