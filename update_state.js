const fs = require('fs');

const stateFile = '.jaa/state.md';
let stateContent = fs.readFileSync(stateFile, 'utf8');

const cartographerNotes = `- **Cartographer (Map Generation)**: Completó mejoras en la distribución de terrenos y recursos procedurales.
  - Se modificaron los umbrales de elevación en \`getTerrainFromNoise\` (\`ProceduralMapGenerator.js\`) para expandir áreas abiertas, reduciendo montañas (umbral 0.80), colinas (0.65) y agua (0.20), lo que minimiza cuellos de botella naturales y facilita la navegación.
  - Se reemplazó el algoritmo aleatorio de \`placeCluster\` por un espiral cuadrado denso, garantizando que los clústeres de recursos (como oro y piedra) se generen como bloques compactos y contiguos, mejorando la legibilidad y el pathfinding de las unidades.
  - Se endureció la heurística de cuellos de botella en \`isValidResourceCenter\`, agregando \`forest\` a los terrenos evaluados y aumentando el umbral de rechazo a 20 tiles en un área 7x7, lo que previene que los recursos se generen atrapados entre bosques y montañas.
  - Se redujo drásticamente el "visual clutter" en \`TerrainDecor.js\` disminuyendo la probabilidad base de aparición de decoraciones menores (flores, hojas, etc.) del 5% al 2%, mejorando el rendimiento de renderizado y la lectura táctica del terreno.`;

// Replace the old Cartographer notes
stateContent = stateContent.replace(
  /- \*\*Cartographer \(Map Generation\)\*\*: Completó mejoras en la distribución de terrenos y recursos procedurales\.\n(  - .*\n)+/g,
  cartographerNotes + '\n'
);

fs.writeFileSync(stateFile, stateContent);
console.log('State updated');
