const fs = require('fs');
const acorn = require('acorn');
const code = fs.readFileSync('effects.js', 'utf8');
try {
  acorn.parse(code, { ecmaVersion: 2022 });
  console.log("No syntax errors.");
} catch(e) {
  console.error("Syntax Error at line", e.loc.line, "column", e.loc.column, ":", e.message);
}
