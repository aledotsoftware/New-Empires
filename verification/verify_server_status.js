const { spawn } = require('child_process');
const http = require('http');

console.log('Starting verification...');

const serverProcess = spawn('node', ['server.js'], {
    env: { ...process.env, TRUST_PROXY: 'true', PORT: '3001' }, // Use 3001 to avoid conflicts
    cwd: process.cwd()
});

serverProcess.stdout.on('data', (data) => {
    console.log(`Server: ${data}`);
});

serverProcess.stderr.on('data', (data) => {
    console.error(`Server Error: ${data}`);
});

// Wait for server to start
setTimeout(() => {
    console.log('Making request to server...');
    const req = http.get('http://localhost:3001/index.html', (res) => {
        console.log(`Status Code: ${res.statusCode}`);
        if (res.statusCode === 200) {
            console.log('✅ Server returned 200 OK');
            cleanup();
            process.exit(0);
        } else {
            console.error(`❌ Server returned ${res.statusCode}`);
            cleanup();
            process.exit(1);
        }
    });

    req.on('error', (e) => {
        console.error(`❌ Request error: ${e.message}`);
        cleanup();
        process.exit(1);
    });

}, 2000); // Give it 2 seconds to start

function cleanup() {
    if (serverProcess) {
        serverProcess.kill();
    }
}

// Timeout if it takes too long
setTimeout(() => {
    console.error('❌ Timeout waiting for server');
    cleanup();
    process.exit(1);
}, 5000);
