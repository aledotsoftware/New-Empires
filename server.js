const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

// Security: Rate Limiting Configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 300; // 300 requests per minute per IP
const MAX_TRACKED_IPS = 10000; // Security: Limit memory usage to prevent DoS
const ipCounts = new Map();

// Periodic cleanup of rate limit data (every 1 minute)
// Security: cleanup interval matched to window to remove stale data faster
setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of ipCounts.entries()) {
        if (now - data.startTime > RATE_LIMIT_WINDOW_MS) {
            ipCounts.delete(ip);
        }
    }
}, 60 * 1000);

// Whitelist of allowed extensions
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml; charset=utf-8',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.ico': 'image/x-icon',
    '.webmanifest': 'application/manifest+json; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8'
};

const server = http.createServer((req, res) => {
    // Security: Restrict HTTP Methods
    // Only allow GET and HEAD requests to reduce attack surface
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.writeHead(405, { 'Allow': 'GET, HEAD' });
        res.end('Method Not Allowed');
        return;
    }

    // Security: Rate Limiting (Fixed Window Counter)
    // Support for reverse proxies (e.g. Heroku, AWS) if configured
    const trustProxy = process.env.TRUST_PROXY === 'true';
    const rawIp = req.socket.remoteAddress || 'unknown';
    // Security Fix: Use the last IP in X-Forwarded-For to prevent spoofing.
    // The last IP is the one that connected to the trusted proxy.
    const ip = (trustProxy && req.headers['x-forwarded-for'])
        ? req.headers['x-forwarded-for'].split(',').pop().trim()
        : rawIp;

    const now = Date.now();

    let clientData = ipCounts.get(ip);

    // Security: Prevent memory exhaustion by capping tracked IPs
    if (!clientData && ipCounts.size >= MAX_TRACKED_IPS) {
        // FIFO eviction: Remove oldest entry to make space
        const oldestIp = ipCounts.keys().next().value;
        ipCounts.delete(oldestIp);
    }

    if (!clientData || now - clientData.startTime > RATE_LIMIT_WINDOW_MS) {
        clientData = { count: 0, startTime: now };
    }

    if (clientData.count >= RATE_LIMIT_MAX_REQUESTS) {
        res.writeHead(429, { 'Content-Type': 'text/plain' });
        res.end('Too Many Requests');
        return;
    }

    clientData.count++;
    ipCounts.set(ip, clientData);

    // Security: Decode URL to handle spaces and special characters
    // This fixes accessibility for assets with special names
    let decodedUrl;
    try {
        decodedUrl = decodeURIComponent(req.url);
    } catch (e) {
        res.writeHead(400);
        res.end('Bad Request');
        return;
    }

    // Security: Prevent Null Byte Injection
    if (decodedUrl.indexOf('\0') !== -1) {
        res.writeHead(400);
        res.end('Bad Request');
        return;
    }

    // Normalize path
    let safePath = path.normalize(decodedUrl).replace(/^(\.\.[\/\\])+/, '');

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
        'server.log',
        'package.json',
        'package-lock.json',
        'pnpm-lock.yaml',
        'yarn.lock',
        '.npmrc',
        '.nvmrc',
        'Dockerfile',
        'docker-compose.yml',
        '.env',
        '.gitignore',
        '.gitattributes',
        '.editorconfig',
        'AGENTS.md'
    ].some(f => f.toLowerCase() === filename.toLowerCase());

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
        '.idea',
        'test-results',
        'tests',
        'verification'
    ];

    // Check for dotfiles in any part of the path (hidden files)
    const isHidden = safePath.split(path.sep).some(part => part.startsWith('.') && part !== '.' && part !== '..');

    if (isSensitive || isHidden || BLOCKED_DIRS.some(d => d.toLowerCase() === firstDir.toLowerCase())) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    // Security: Block root-level data/config files
    // Prevent exposure of config files (e.g. .json, .txt) that might be placed in root
    // Only allow specific file types in root (html, js, css, etc.)
    const isRootFile = normalizedPath === filename;
    if (isRootFile) {
        const ext = path.extname(filename).toLowerCase();
        const allowedRootFiles = ['robots.txt', 'manifest.json'];
        if ((ext === '.json' || ext === '.txt') && !allowedRootFiles.includes(filename.toLowerCase())) {
            res.writeHead(403);
            res.end('Forbidden');
            return;
        }
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

        const headers = {
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
        };

        // Cache-Control: no-cache for index.html to ensure users get latest version
        if (safePath === '/index.html') {
            headers['Cache-Control'] = 'no-cache';
        }

        res.writeHead(200, headers);

        const readStream = fs.createReadStream(filePath);

        // Security: Handle stream errors to prevent server crash (DoS)
        readStream.on('error', (streamErr) => {
            console.error('Stream error:', streamErr);
            if (!res.headersSent) {
                res.writeHead(500);
                res.end('Internal Server Error');
            }
        });

        readStream.pipe(res);
    });
});

// Security: Handle client connection errors
server.on('clientError', (err, socket) => {
    if (err.code === 'ECONNRESET' || !socket.writable) {
        return;
    }
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

// Security: Timeouts to prevent Slowloris attacks
// Set timeouts to ensure connections don't hang indefinitely
server.keepAliveTimeout = 60000; // 1 minute
server.headersTimeout = 65000; // Must be greater than keepAliveTimeout
server.requestTimeout = 30000; // 30 seconds for receiving the request body

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
