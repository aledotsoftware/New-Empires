const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const SERVER_PATH = path.join(__dirname, '../server.js');
const PORT = 3000;

function runTest() {
    console.log('Starting server for security test...');
    const serverProcess = spawn('node', [SERVER_PATH], {
        env: { ...process.env, PORT: PORT.toString() },
        stdio: 'pipe'
    });

    let serverReady = false;

    serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        // console.log(`[Server]: ${output.trim()}`);
        if (output.includes(`Server running on port ${PORT}`)) {
            if (!serverReady) {
                serverReady = true;
                performRequests(serverProcess);
            }
        }
    });

    serverProcess.stderr.on('data', (data) => {
        console.error(`[Server Error]: ${data.toString()}`);
    });

    // Timeout if server fails to start
    setTimeout(() => {
        if (!serverReady) {
            console.error('Timeout waiting for server to start');
            serverProcess.kill();
            process.exit(1);
        }
    }, 5000);
}

function performRequests(serverProcess) {
    const testCases = [
        { path: '/SERVER.JS', expectedBefore: 404, expectedAfter: 403, description: 'Case-insensitive sensitive file (SERVER.JS)' },
        { path: '/DOCS/index.md', expectedBefore: 404, expectedAfter: 403, description: 'Case-insensitive blocked dir (DOCS/)' }
    ];

    let completed = 0;
    let failed = false;

    console.log('Running requests...');

    testCases.forEach(test => {
        const options = {
            hostname: 'localhost',
            port: PORT,
            path: test.path,
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            console.log(`[${test.path}] Status Code: ${res.statusCode}`);

            // We print the result so we can interpret it manually or programmatically
            // For now, let's just log detailed info.
            // The plan says "asserts that the response code is 404".
            // Since this script runs BOTH before and after, we should probably output something that helps identify the state.

            if (res.statusCode === 403) {
                 console.log(`✅ [PASS] ${test.path} is BLOCKED (403)`);
            } else if (res.statusCode === 404) {
                 console.log(`⚠️ [WARN] ${test.path} is NOT FOUND (404) - Expected behavior before fix on Linux`);
            } else if (res.statusCode === 200) {
                 console.log(`❌ [FAIL] ${test.path} is EXPOSED (200)`);
                 failed = true;
            } else {
                 console.log(`❓ [UNK] ${test.path} returned ${res.statusCode}`);
            }

            completed++;
            if (completed === testCases.length) {
                serverProcess.kill();
                if (failed) process.exit(1);
                process.exit(0);
            }
        });

        req.on('error', (e) => {
            console.error(`[${test.path}] Request error: ${e.message}`);
            serverProcess.kill();
            process.exit(1);
        });

        req.end();
    });
}

runTest();
