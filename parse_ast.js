const fs = require('fs');
const code = fs.readFileSync('effects.js', 'utf8');

const classMatch = code.match(/class ParticleSystem \{([\s\S]*?)class SoundSystem \{/);
if (classMatch) {
    const classBody = classMatch[1];
    if (classBody.includes('createBuildingDamageEffect')) {
        console.log("Method createBuildingDamageEffect is inside ParticleSystem.");
    } else {
        console.log("Method is NOT inside ParticleSystem.");
    }
} else {
    console.log("Could not find ParticleSystem body.");
}
