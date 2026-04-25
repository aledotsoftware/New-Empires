const { readFileSync } = require('fs');

const data = readFileSync('./assets/civilization/romans.json', 'utf-8');
const obj = JSON.parse(data);

console.log(obj.uniqueTechnologies[0].effects);
