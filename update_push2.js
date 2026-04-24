const fs = require('fs');
const file = 'js/core/Game.js';
let content = fs.readFileSync(file, 'utf8');

const search = `                            if (this.resources[res] < amount) {
                                resSpan.style.color = 'var(--accent-red)';
                                resSpan.setAttribute('aria-label', \`\${amount} \${res} (Insuficiente)\`);
                                missingResources.push(\`\${res} (\${amount - Math.floor(this.resources[res])})\`);
                            } else {`;

const replace = `                            if (this.resources[res] < amount) {
                                resSpan.style.color = 'var(--accent-red)';
                                resSpan.setAttribute('aria-label', \`\${amount} \${res} (Insuficiente)\`);
                                missingResources[missingResources.length] = \`\${res} (\${amount - Math.floor(this.resources[res])})\`;
                            } else {`;

if (content.includes(search)) {
    content = content.replace(search, replace);
    fs.writeFileSync(file, content);
    console.log('Game.js updated successfully (3).');
} else {
    console.log('Search block 3 not found.');
}

const search4 = `                        if (buttonData._missingResources && buttonData._missingResources.length > 0) {
                            // Translate resource names for better UX
                            const translatedMissing = [];
                            const len = buttonData._missingResources.length;
                            for (let i = 0; i < len; i++) {
                                const mr = buttonData._missingResources[i];
                                let [name, amt] = mr.split(' (');
                                amt = '(' + amt;
                                if (name === 'food') name = 'comida';
                                else if (name === 'wood') name = 'madera';
                                else if (name === 'gold') name = 'oro';
                                else if (name === 'stone') name = 'piedra';
                                translatedMissing.push(\`\${name} \${amt}\`);
                            }`;

const replace4 = `                        if (buttonData._missingResources && buttonData._missingResources.length > 0) {
                            // Translate resource names for better UX
                            const len = buttonData._missingResources.length;
                            const translatedMissing = new Array(len);
                            for (let i = 0; i < len; i++) {
                                const mr = buttonData._missingResources[i];
                                let [name, amt] = mr.split(' (');
                                amt = '(' + amt;
                                if (name === 'food') name = 'comida';
                                else if (name === 'wood') name = 'madera';
                                else if (name === 'gold') name = 'oro';
                                else if (name === 'stone') name = 'piedra';
                                translatedMissing[i] = \`\${name} \${amt}\`;
                            }`;

if (content.includes(search4)) {
    content = content.replace(search4, replace4);
    fs.writeFileSync(file, content);
    console.log('Game.js updated successfully (4).');
} else {
    console.log('Search block 4 not found.');
}
