const fs = require('fs');
const acorn = require('acorn');
const code = fs.readFileSync('effects.js', 'utf8');
const ast = acorn.parse(code, { ecmaVersion: 2020 });
const particleSystemClass = ast.body.find(node => node.type === 'ClassDeclaration' && node.id.name === 'ParticleSystem');

if (particleSystemClass) {
    const hasMethod = particleSystemClass.body.body.find(node => node.type === 'MethodDefinition' && node.key.name === 'createBuildingDamageEffect');
    console.log("Has createBuildingDamageEffect method?", !!hasMethod);
} else {
    console.log("ParticleSystem class not found");
}
