const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_ROOT = path.resolve(__dirname); // Serve files from current directory

const MIMETYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm'
};

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // Normalize path and prevent directory traversal
  let safePath = path.normalize(req.url).replace(/^(\.\.[\/\\])+/, '');

  // Handle default route
  if (safePath === '/' || safePath === '\\') {
    safePath = '/index.html';
  }

  // Construct absolute path
  let filePath = path.join(PUBLIC_ROOT, safePath);

  // Ensure path is still within root (extra safety check)
  if (!filePath.startsWith(PUBLIC_ROOT)) {
     res.writeHead(403);
     res.end('403 Forbidden');
     return;
  }

  // Remove query string if present (though normalize usually handles this, verify logic)
  // Actually, req.url contains query string. path.normalize might not strip it.
  // Better to split '?' first.

  const urlParts = req.url.split('?');
  const urlPath = urlParts[0];

  // Re-sanitize urlPath
  safePath = path.normalize(urlPath).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '\\') {
      safePath = '/index.html';
  }

  filePath = path.join(PUBLIC_ROOT, safePath);

  // Final check
  if (!filePath.startsWith(PUBLIC_ROOT)) {
      res.writeHead(403);
      res.end('403 Forbidden');
      return;
  }

  const extname = path.extname(filePath);
  let contentType = MIMETYPES[extname] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Page not found - Try index.html fallback for SPA or 404
        // Since this is a game, strict 404 for assets is better to debug missing files
        res.writeHead(404);
        res.end('404 Not Found');
      } else {
        // Server error
        res.writeHead(500);
        res.end('Server Error: ' + err.code);
      }
    } else {
      // Success
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://0.0.0.0:${PORT}/`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});
