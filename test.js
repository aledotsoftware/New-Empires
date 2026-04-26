const fs = require('fs');

const m = [];
fs.readdirSync('assets/technologies').forEach(f => {
    const data = JSON.parse(fs.readFileSync('assets/technologies/' + f, 'utf8'));
    Object.keys(data.technologies || {}).forEach(k => {
        const tech = data.technologies[k];
        if (tech.effects && tech.effects.unitStats) {
            Object.keys(tech.effects.unitStats).forEach(u => {
                Object.keys(tech.effects.unitStats[u]).forEach(s => {
                    m.push(s);
                });
            });
        }
    });
});
console.log(Array.from(new Set(m)));
