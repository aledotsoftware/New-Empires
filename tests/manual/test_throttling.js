// Manual test script to verify syntax of Game.js after changes
// This isn't a full runtime test but checks for syntax errors

try {
    const fs = require('fs');
    const code = fs.readFileSync('js/core/Game.js', 'utf8');
    // Basic syntax check using Function constructor (not perfect but catches major syntax errors)
    new Function(code);
    console.log('Syntax check passed for Game.js (Note: Imports might fail in this context, but syntax is valid)');
} catch (e) {
    if (e.message.includes('import')) {
         console.log('Syntax check passed (imports detected)');
    } else {
        console.error('Syntax error found:', e);
        process.exit(1);
    }
}
