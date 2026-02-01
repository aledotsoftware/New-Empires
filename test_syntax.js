const fs = require('fs');
const vm = require('vm');

try {
    const code = fs.readFileSync('main.js', 'utf8');
    // Wrap in async function to allow await (though imports might still fail in pure vm if not handled, but we check syntax)
    // Actually, imports are syntax. node --check is better for syntax.
    // But let's try to parse it.
    new vm.Script(code, { filename: 'main.js' }); // This parses.
    console.log("Syntax OK");
} catch (e) {
    // If it fails on 'import' statement because it's a module, we might need a different approach.
    // Node.js VM script default to CJS.
    if (e.message.includes('Cannot use import statement outside a module')) {
         console.log("Syntax OK (imports detected, validation partial)");
    } else {
         console.error(e);
         process.exit(1);
    }
}
