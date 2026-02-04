const http = require('http');

function checkHeaders() {
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/',
        method: 'HEAD'
    };

    const req = http.request(options, (res) => {
        console.log('Headers:', res.headers);

        const coop = res.headers['cross-origin-opener-policy'];
        const corp = res.headers['cross-origin-resource-policy'];

        if (coop === 'same-origin' && corp === 'same-origin') {
            console.log('✅ Security Headers Present');
            checkBlockedFile();
        } else {
            console.log('❌ Security Headers Missing');
            process.exit(1);
        }
    });

    req.on('error', (e) => {
        console.error(`problem with request: ${e.message}`);
        process.exit(1);
    });

    req.end();
}

function checkBlockedFile() {
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/test_syntax.js',
        method: 'HEAD'
    };

    const req = http.request(options, (res) => {
        if (res.statusCode === 403) {
            console.log('✅ test_syntax.js is blocked (403)');
            process.exit(0);
        } else {
            console.log(`❌ test_syntax.js is NOT blocked (Status: ${res.statusCode})`);
            process.exit(1);
        }
    });

    req.on('error', (e) => {
        console.error(`problem with request: ${e.message}`);
        process.exit(1);
    });

    req.end();
}

checkHeaders();
