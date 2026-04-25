const fs = require('fs');
const stateFile = '.jaa/state.md';
let state = fs.readFileSync(stateFile, 'utf8');

const note = `- **Drillmaster (Controls & Ergonomics)**: Mejoró la ergonomía de comandos y hotkeys para reducir fricción táctica.
  - Se vinculó correctamente el botón \`#closeBuildMenuBtn\` al evento de cierre para asegurar que la UI no quede bloqueada y se libere la matriz de comandos.
  - Se flexibilizó el acceso al menú de construcción (hotkey "B"); ahora se abre siempre que haya al menos un aldeano seleccionado, en lugar de requerir que sea la única unidad.
  - Se implementó un sistema de "onboarding silencioso" que detecta y sugiere hotkeys contextualmente (ej. al seleccionar un aldeano por primera vez sugiere "Q/B", o "F" al seleccionar grupos militares).
  - Se corrigió la documentación \`docs/sistemas/HOTKEYS.md\` para que el resumen visual (QWERTY) coincida estrictamente con las implementaciones de los edificios en el código real.`;

if (state.includes('**Drillmaster')) {
    console.log('Drillmaster notes already present.');
} else {
    state = state.replace('## 📝 AGENT NOTES', '## 📝 AGENT NOTES\n' + note);
    fs.writeFileSync(stateFile, state);
    console.log('State updated.');
}
