const { spawn } = require('child_process');
const http = require('http');

const PORT = 3001;

console.log('Starting server for rate limit verification...');
const serverProcess = spawn('node', ['server.js'], {
    env: { ...process.env, TRUST_PROXY: 'true', PORT: PORT.toString() },
    stdio: 'pipe'
});

serverProcess.stdout.on('data', (data) => {
    // console.log(`[Server]: ${data}`);
});

serverProcess.stderr.on('data', (data) => {
    console.error(`[Server Error]: ${data}`);
});

function makeRequest(ip, path = '/') {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: PORT,
            path: path,
            method: 'GET',
            headers: {
                'X-Forwarded-For': ip
            }
        };

        const req = http.request(options, (res) => {
            res.on('data', () => {}); // Consume data
            res.on('end', () => {
                resolve(res.statusCode);
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        req.end();
    });
}

async function runTests() {
    // Wait for server to start
    await new Promise(r => setTimeout(r, 1000));

    console.log('Test 1: Verifying standard rate limiting...');
    const targetIp = '10.0.0.1';
    let blocked = false;

    // Send 305 requests (limit is 300)
    // We send in batches to be faster
    const promises = [];
    for (let i = 0; i < 310; i++) {
        promises.push(makeRequest(targetIp).then(status => {
            if (status === 429) blocked = true;
            return status;
        }));
    }

    await Promise.all(promises);

    if (blocked) {
        console.log('✅ Standard rate limiting working (got 429).');
    } else {
        console.error('❌ Standard rate limiting FAILED. Did not get 429.');
        process.exitCode = 1;
    }

    console.log('Test 2: Verifying stability with unique IPs...');
    // Send requests from different IPs
    const uniqueIps = 200;
    let successCount = 0;
    const ipPromises = [];

    for (let i = 0; i < uniqueIps; i++) {
        const ip = `11.0.${Math.floor(i / 255)}.${i % 255}`;
        ipPromises.push(makeRequest(ip).then(status => {
            // We expect 200 (or 403/404 if path invalid, but we use / so 200 or 403 depending on file)
            // Actually / defaults to index.html which exists.
            if (status === 200) successCount++;
            return status;
        }));
    }

    await Promise.all(ipPromises);

    if (successCount === uniqueIps) {
        console.log(`✅ Server handled ${uniqueIps} unique IPs successfully.`);
    } else {
        console.error(`❌ Server failed. Success count: ${successCount}/${uniqueIps}`);
        process.exitCode = 1;
    }

    serverProcess.kill();
}

runTests().catch(e => {
    console.error('Test script error:', e);
    serverProcess.kill();
    process.exit(1);
});
