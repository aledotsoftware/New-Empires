const fs = require('fs');
let md = fs.readFileSync('.jaa/state.md', 'utf8');

if (!md.includes('fixed SaveManager & ProductionQueue regressions')) {
    md += '\n- Fixed SaveManager & ProductionQueue regressions: Ensure cost is correctly stored/restored and researchedTechs Set is serialized properly.';
    fs.writeFileSync('.jaa/state.md', md);
}
