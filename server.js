const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

// Whitelist of allowed extensions
const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.ico': 'image/x-icon',
    '.webmanifest': 'application/manifest+json',
    '.txt': 'text/plain'
};

const server = http.createServer((req, res) => {
    // Normalize path
    let safePath = path.normalize(req.url).replace(/^(\.\.[\/\\])+/, '');

    // Remove query string
    safePath = safePath.split('?')[0];

    // Default to index.html
    if (safePath === '/' || safePath === '') {
        safePath = '/index.html';
    }

    // Security: Block sensitive files (Root level protection)
    // These files might have allowed extensions (like .js or .json) but must never be served
    const filename = path.basename(safePath);
    const isSensitive = [
        'server.js',
        'package.json',
        'package-lock.json',
        'pnpm-lock.yaml',
        'Dockerfile',
        'docker-compose.yml',
        '.env'
    ].includes(filename);

    // Security: Block sensitive directories
    // Explicitly deny access to internal folders
    const normalizedPath = safePath.startsWith(path.sep) ? safePath.slice(1) : safePath;
    const firstDir = normalizedPath.split(path.sep)[0];
    const BLOCKED_DIRS = [
        'docs',
        '_deprecated',
        '.Jules',
        '.git',
        '.jules',
        'node_modules',
        '.vscode',
        '.idea'
    ];

    // Check for dotfiles in any part of the path (hidden files)
    const isHidden = safePath.split(path.sep).some(part => part.startsWith('.') && part !== '.' && part !== '..');

    if (isSensitive || isHidden || BLOCKED_DIRS.includes(firstDir)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    // Construct full path
    const filePath = path.join(__dirname, safePath);

    // Prevent directory traversal (ensure strict prefix match)
    if (!filePath.startsWith(path.join(__dirname, path.sep))) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    // Check if file exists
    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404);
            res.end('Not Found');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();

        // Security: Strict Extension Whitelist
        // Only serve files with explicitly allowed extensions
        // This blocks .log, .md, .backup, .sh, etc. automatically
        if (!MIME_TYPES[ext]) {
            res.writeHead(403);
            res.end('Forbidden');
            return;
        }

        const contentType = MIME_TYPES[ext];

        res.writeHead(200, {
            'Content-Type': contentType,
            // Security headers
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            // CSP: Allow self, Google Fonts, and inline scripts/styles (required for current app structure)
            'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';",
            // HSTS: Enforce HTTPS for 2 years (ignored on HTTP, beneficial if behind SSL proxy)
            'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
            // Referrer: Only send origin when cross-origin
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            // Permissions: Disable sensitive features
            'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), vr=()'
        });

        const readStream = fs.createReadStream(filePath);
        readStream.pipe(res);
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
