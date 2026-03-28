const fs = require('fs');

// 1. Fix Game.js cursor
const gamePath = 'd:/New-Empires/js/core/Game.js';
if (fs.existsSync(gamePath)) {
    let content = fs.readFileSync(gamePath, 'utf8');
    const target = /'cursor-forbidden': 'assets\/icons\/cancel\.png'/;
    if (target.test(content)) {
        content = content.replace(target, "'cursor-forbidden': 'assets/icons/error.png'");
        fs.writeFileSync(gamePath, content);
        console.log('Game.js fixed');
    } else {
        console.warn('Game.js target not found');
    }
}

// 2. Fix mongols.json buildings
const mongolPath = 'd:/New-Empires/assets/civilization/mongols.json';
if (fs.existsSync(mongolPath)) {
    let content = fs.readFileSync(mongolPath, 'utf8');
    
    // Replace missing icons with thematic ones
    content = content.replace(/"assets\/icons\/mongols\/templo\.png"/, '"assets/icons/mongols/yurta.png"');
    content = content.replace(/"assets\/icons\/mongols\/mercado\.png"/, '"assets/icons/mongols/yurta.png"');
    content = content.replace(/"assets\/icons\/mongols\/taller\.png"/, '"assets/icons/mongols/campamento.png"');
    
    fs.writeFileSync(mongolPath, content);
    console.log('mongols.json fixed');
}
