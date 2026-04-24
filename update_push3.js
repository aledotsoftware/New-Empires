const fs = require('fs');
const file = 'js/core/Game.js';
let content = fs.readFileSync(file, 'utf8');

const search5 = `                    const missing = [];
                    for (let [resource, amount] of Object.entries(cost)) {
                        if (this.resources[resource] < amount) {
                            const diff = amount - this.resources[resource];
                            missing.push(\`\${resource} (\${diff})\`);
                        }
                    }`;

const replace5 = `                    const missing = [];
                    let mCount = 0;
                    for (let [resource, amount] of Object.entries(cost)) {
                        if (this.resources[resource] < amount) {
                            const diff = amount - this.resources[resource];
                            missing[mCount++] = \`\${resource} (\${diff})\`;
                        }
                    }`;

if (content.includes(search5)) {
    content = content.replace(search5, replace5);
    fs.writeFileSync(file, content);
    console.log('Game.js updated successfully (5).');
} else {
    console.log('Search block 5 not found.');
}

const search6 = `        const getCostText = (cost) => {
            const parts = [];
            for (const [res, amount] of Object.entries(cost)) {
                if (amount > 0) parts.push(\`\${amount} \${res}\`);
            }
            return parts.length > 0 ? \`Costo: \${parts.join(', ')}\` : '';
        };`;

const replace6 = `        const getCostText = (cost) => {
            const parts = [];
            let pCount = 0;
            for (const [res, amount] of Object.entries(cost)) {
                if (amount > 0) parts[pCount++] = \`\${amount} \${res}\`;
            }
            return pCount > 0 ? \`Costo: \${parts.join(', ')}\` : '';
        };`;

if (content.includes(search6)) {
    content = content.replace(search6, replace6);
    fs.writeFileSync(file, content);
    console.log('Game.js updated successfully (6).');
} else {
    console.log('Search block 6 not found.');
}
