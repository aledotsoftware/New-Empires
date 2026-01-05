## 2024-05-24 - Unnecessary Spatial Queries
**Learning:** `Unit.findNearbyEnemy` was querying `buildingGrid` but immediately filtering out buildings with `isUnit` check.
**Action:** Always verify that grid queries match the target filter criteria. If looking for units, only query unit grid.
