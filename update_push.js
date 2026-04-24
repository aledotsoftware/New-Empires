const fs = require('fs');
const file = 'js/core/Game.js';
let content = fs.readFileSync(file, 'utf8');

const search = `                            const currentMissingResources = [];
                            if (buttonData.cost) {
                                for (const [res, amount] of Object.entries(buttonData.cost)) {
                                    if (this.resources[res] < amount) {
                                        currentMissingResources.push(\`\${res} (\${Math.ceil(amount - this.resources[res])})\`);
                                    }
                                }
                            }`;

const replace = `                            const currentMissingResources = [];
                            let cmrCount = 0;
                            if (buttonData.cost) {
                                for (const [res, amount] of Object.entries(buttonData.cost)) {
                                    if (this.resources[res] < amount) {
                                        currentMissingResources[cmrCount++] = \`\${res} (\${Math.ceil(amount - this.resources[res])})\`;
                                    }
                                }
                            }`;

if (content.includes(search)) {
    content = content.replace(search, replace);
    fs.writeFileSync(file, content);
    console.log('Game.js updated successfully (1).');
} else {
    console.log('Search block 1 not found.');
}

const search2 = `                                    if (mr.includes('food')) translated.push(mr.replace('food', 'Comida'));
                                    else if (mr.includes('wood')) translated.push(mr.replace('wood', 'Madera'));
                                    else if (mr.includes('gold')) translated.push(mr.replace('gold', 'Oro'));
                                    else if (mr.includes('stone')) translated.push(mr.replace('stone', 'Piedra'));
                                    else translated.push(mr);`;

const replace2 = `                                    if (mr.includes('food')) translated[i] = mr.replace('food', 'Comida');
                                    else if (mr.includes('wood')) translated[i] = mr.replace('wood', 'Madera');
                                    else if (mr.includes('gold')) translated[i] = mr.replace('gold', 'Oro');
                                    else if (mr.includes('stone')) translated[i] = mr.replace('stone', 'Piedra');
                                    else translated[i] = mr;`;

if (content.includes(search2)) {
    content = content.replace(search2, replace2);
    fs.writeFileSync(file, content);
    console.log('Game.js updated successfully (2).');
} else {
    console.log('Search block 2 not found.');
}
