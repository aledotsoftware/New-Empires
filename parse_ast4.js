const fs = require('fs');
const acorn = require('acorn');
const code = fs.readFileSync('effects.js', 'utf8');
const ast = acorn.parse(code, { ecmaVersion: 2022 });

let foundMethod = false;

for (const node of ast.body) {
  if (node.type === 'ClassDeclaration' && node.id.name === 'ParticleSystem') {
    const methods = node.body.body;
    for (const m of methods) {
      if (m.type === 'MethodDefinition' && m.key.name === 'createBuildingDamageEffect') {
         foundMethod = true;
         console.log("Found createBuildingDamageEffect method!");
      }
    }
  }
}

if (!foundMethod) console.log("Did not find createBuildingDamageEffect method in ParticleSystem");
