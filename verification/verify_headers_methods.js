
const http = require('http');

const PORT = 3000;

function check(name, options, validationFn) {
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: 'localhost',
            port: PORT,
            ...options
        }, (res) => {
            try {
                validationFn(res);
                console.log(`✅ [PASS] ${name}`);
                resolve();
            } catch (e) {
                console.error(`❌ [FAIL] ${name}: ${e.message}`);
                reject(e);
            }
            res.resume();
        });

        req.on('error', (e) => {
            console.error(`❌ [FAIL] ${name}: Request error: ${e.message}`);
            reject(e);
        });

        req.end();
    });
}

async function runTests() {
    console.log('Running verification tests...');

    try {
        // Test 1: POST request (Method Not Allowed)
        await check('POST /index.html returns 405', {
            path: '/index.html',
            method: 'POST'
        }, (res) => {
            if (res.statusCode !== 405) {
                throw new Error(`Expected status 405, got ${res.statusCode}`);
            }
            if (!res.headers['allow'] || !res.headers['allow'].includes('GET')) {
                throw new Error(`Expected Allow header to include GET, got ${res.headers['allow']}`);
            }
        });

        // Test 2: GET /index.html (Headers)
        await check('GET /index.html headers', {
            path: '/index.html',
            method: 'GET'
        }, (res) => {
            if (res.statusCode !== 200) {
                throw new Error(`Expected status 200, got ${res.statusCode}`);
            }
            const contentType = res.headers['content-type'];
            if (!contentType || !contentType.includes('charset=utf-8')) {
                throw new Error(`Expected Content-Type to contain charset=utf-8, got ${contentType}`);
            }
            const cacheControl = res.headers['cache-control'];
            if (cacheControl !== 'no-cache') {
                throw new Error(`Expected Cache-Control: no-cache, got ${cacheControl}`);
            }
        });

        // Test 3: GET /main.js (Charset)
        await check('GET /main.js charset', {
            path: '/main.js',
            method: 'GET'
        }, (res) => {
             if (res.statusCode !== 200) {
                throw new Error(`Expected status 200, got ${res.statusCode}`);
            }
            const contentType = res.headers['content-type'];
            if (!contentType || !contentType.includes('charset=utf-8')) {
                throw new Error(`Expected Content-Type to contain charset=utf-8, got ${contentType}`);
            }
             // Should NOT have Cache-Control: no-cache (unless I added it globally which I didn't)
             if (res.headers['cache-control']) {
                 // It's okay if it's there, but my change only added it for index.html
                 // So for now, no assertion on absence, just presence of charset
             }
        });

        console.log('🎉 All tests passed!');
        process.exit(0);

    } catch (e) {
        console.error('Test suite failed');
        process.exit(1);
    }
}

// Wait for server to be ready? Assuming it's running.
// Actually, I should probably start it?
// The instructions say "Run the server and the script".
// I'll assume I need to start it manually in bash.

runTests();
