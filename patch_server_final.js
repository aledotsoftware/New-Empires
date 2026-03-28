const fs = require('fs');

const serverPath = 'd:/New-Empires/server.js';
if (fs.existsSync(serverPath)) {
    let content = fs.readFileSync(serverPath, 'utf8');

    // 1. MIME types fix
    if (!content.includes("'.webp': 'image/webp'")) {
        content = content.replace("'.png': 'image/png',", "'.png': 'image/png',\n    '.webp': 'image/webp',");
    }

    // 2. High Rate Limit
    content = content.replace(/RATE_LIMIT_MAX_REQUESTS = .*?;/, 'RATE_LIMIT_MAX_REQUESTS = 10000;');

    // 3. Robust path logic
    const pathLogicReplacer = `
    const decodedUrl = decodeURIComponent(req.url);
    const safePath = path.normalize(decodedUrl).replace(/^[\\\/\\.]+/, '');
    const firstDir = safePath.split(path.sep)[0] || '';
    const isRoot = safePath === '' || safePath === 'index.html';
    const filePath = path.resolve(__dirname, safePath === '' ? 'index.html' : safePath);

    const isSensitive = ['server.js', 'package.json', 'Dockerfile', 'docker-compose.yml', 'server.log'].some(f => filePath.endsWith(f));
    const isAllowedDir = ['assets', 'js'].includes(firstDir.toLowerCase());
    
    // Explicit security check
    if (isSensitive || (!isRoot && !isAllowedDir)) {
        console.warn(\`[SERVER] Blocking 403: \${decodedUrl} (root: \${isRoot}, allowedDir: \${isAllowedDir})\`);
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }
`;
    // We'll target the area between decodeURIComponent and stats check if possible
    // Actually simpler to just replace large chunks
    
    // 4. Cache control for JSON
    if (!content.includes("ext === '.json'")) {
        content = content.replace("if (safePath === '/index.html') {", "if (safePath.endsWith('.html') || safePath.endsWith('.json')) {");
    }

    fs.writeFileSync(serverPath, content);
    console.log('Patched server.js successfully');
}
