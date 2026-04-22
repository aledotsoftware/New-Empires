const { execSync } = require('child_process');
try {
  execSync('kill $(lsof -t -i :8080)');
} catch (e) {}
