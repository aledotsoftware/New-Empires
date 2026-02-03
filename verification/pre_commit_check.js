const fs = require('fs');
const { execSync } = require('child_process');

const filesToCheck = ['js/core/Game.js'];

let hasError = false;

console.log('🔍 Running syntax check...');

filesToCheck.forEach(file => {
    try {
        // Use node --check for syntax validation
        execSync(`node --check ${file}`, { stdio: 'inherit' });
        console.log(`✅ ${file} syntax OK`);
    } catch (e) {
        console.error(`❌ ${file} syntax ERROR`);
        hasError = true;
    }
});

if (hasError) {
    process.exit(1);
} else {
    console.log('✨ All checks passed!');
}
