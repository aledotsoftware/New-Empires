const fs = require('fs');
let state = fs.readFileSync('.jaa/state.md', 'utf8');

const newEntry = "- [Bard] Completed UI and Feedback overhaul: expanded the action panel to a full 3x5 grid with proper CSS alignment, resolved global hotkey conflicts for Z/X/C/V/B mapping, and integrated robust synthesized audio/visual cues for military production, unit training completion, and under-attack notifications.";

state = state.replace('## Agent Notes\n', '## Agent Notes\n' + newEntry + '\n');
fs.writeFileSync('.jaa/state.md', state);
console.log('State updated');
