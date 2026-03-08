const fs = require('fs');
const code = fs.readFileSync('effects.js', 'utf8');
// The code might not be evaluated easily if it has modules or document.
// Let's just do a simple regex match to ensure it's a method in ParticleSystem.
const lines = code.split('\n');
let inParticleSystem = false;
let foundMethod = false;

for (const line of lines) {
    if (line.includes('class ParticleSystem')) {
        inParticleSystem = true;
    }
    if (inParticleSystem && line.includes('createBuildingDamageEffect(')) {
        foundMethod = true;
    }
}
console.log("Found method inside ParticleSystem:", foundMethod);
