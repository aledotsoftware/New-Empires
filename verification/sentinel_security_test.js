const http = await import('http');
const { spawn } = await import('child_process');

const PORT = 3001;
process.env.PORT = PORT;

console.log(`Starting server on port ${PORT}...`);
const serverProcess = spawn('node', ['server.js'], {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'pipe' // Capture output to avoid clutter, but maybe we want to see it?
});

serverProcess.stdout.on('data', (data) => {
    // console.log(`Server: ${data}`);
});
serverProcess.stderr.on('data', (data) => {
    console.error(`Server Error: ${data}`);
});

// Give server time to start
setTimeout(runTests, 2000);

async function runTests() {
    console.log('Running Security Tests...');
    let passed = true;

    try {
        // Test 1: Valid Root File
        console.log('Test 1: Valid Root File (/main.js)');
        if (!await checkStatus('/main.js', 200)) passed = false;

        // Test 2: Valid Asset
        console.log('Test 2: Valid Asset (/assets/civilization/romans.json)');
        if (!await checkStatus('/assets/civilization/romans.json', 200)) passed = false;

        // Test 3: Blocked Directory (/docs/INDEX.md)
        console.log('Test 3: Blocked Directory (/docs/INDEX.md)');
        if (!await checkStatus('/docs/INDEX.md', 403)) passed = false;

        // Test 4: Non-Whitelisted Directory (/secret_dir/file.txt)
        // With directory whitelist, this should be 403 regardless of file existence
        console.log('Test 4: Non-Whitelisted Directory (/secret_dir/file.txt)');
        if (!await checkStatus('/secret_dir/file.txt', 403)) passed = false;

    } catch (e) {
        console.error('Test Exception:', e);
        passed = false;
    } finally {
        serverProcess.kill();
        if (passed) {
            console.log('✅ All Security Tests Passed');
            process.exit(0);
        } else {
            console.error('❌ Tests Failed');
            process.exit(1);
        }
    }
}

function checkStatus(urlPath, expectedCode) {
    return new Promise((resolve) => {
        http.get(`http://localhost:${PORT}${urlPath}`, (res) => {
            if (res.statusCode === expectedCode) {
                console.log(`   ✅ Success: Got ${res.statusCode}`);
                resolve(true);
            } else {
                console.error(`   ❌ Failed: Expected ${expectedCode}, got ${res.statusCode}`);
                resolve(false);
            }
        }).on('error', (e) => {
            console.error(`   ❌ Failed: Connection error: ${e.message}`);
            resolve(false);
        });
    });
}
