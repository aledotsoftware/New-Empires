const fs = require('fs');
const path = 'd:/New-Empires/js/core/Game.js';
let content = fs.readFileSync(path, 'utf8');

console.log('Patching Game.js for syntax errors...');

// Regex to find the broken block: 
// It ends with } }); (broken) and followed by legacy buttons. push({ ... archer ... }); }
const brokenBlockRegex = /\s+buttons\.push\(\{[\s\S]*?\}\);\s+\}\s+\}\);\s+buttons\.push\(\{[\s\S]*?'archer'[\s\S]*?\}\);\s+\}/;

const correctReplacement = `
                buttons.push({
                    iconKey: iconKey,
                    iconFallback: unitType === 'villager' ? '👨\u200d🌾' : '⚔️',
                    label: \`Convocar \${name}\`,
                    description: desc,
                    hotkey: hotkeys[i] || 'Q',
                    cost: cost,
                    action: () => this.trainUnit(unitType, this.selectedEntities[0]),
                    enabled: enabled,
                    error: error
                });
            }
        }`;

if (brokenBlockRegex.test(content)) {
    content = content.replace(brokenBlockRegex, correctReplacement);
    fs.writeFileSync(path, content);
    console.log('Successfully fixed syntax error.');
} else {
    console.warn('Broken block not found with standard regex. Trying more flexible version...');
    // Try to just find the }); on its own line after buttons.push
    const fallbackRegex = /}\s+}\);\s+\n\s+buttons\.push\(\{[\s\S]*?'archer'[\s\S]*?\}\);\s+}/;
    if (fallbackRegex.test(content)) {
        content = content.replace(fallbackRegex, '}\n        }');
        fs.writeFileSync(path, content);
        console.log('Successfully fixed syntax error with fallback regex.');
    } else {
        console.error('FAILED to find broken block.');
        // Direct line range replacement as absolute fallback
        // lines 5552 to 5565
        const lines = content.split('\n');
        // Let's find index where line contains }); and before has buttons.push
        let foundIdx = -1;
        for(let i=5500; i<lines.length; i++) {
             if(lines[i].includes('});') && lines[i-1].includes('}')) {
                 foundIdx = i;
                 break;
             }
        }
        if(foundIdx !== -1) {
             console.log('Found broken line at ' + (foundIdx+1));
             // Remove from foundIdx to end of current block
             let endIdx = foundIdx;
             for(let j=foundIdx; j<foundIdx+20; j++) {
                 if(lines[j].trim() === '}') {
                     endIdx = j;
                     break;
                 }
             }
             lines.splice(foundIdx, endIdx - foundIdx + 1, '        }');
             fs.writeFileSync(path, lines.join('\n'));
             console.log('Fixed using line index fallback.');
        }
    }
}
