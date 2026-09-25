/**
 * free-ports.js
 * Kills any processes occupying ports 3000 and 5000 before dev servers start.
 */
const { execSync } = require('child_process');

const ports = [3000, 5000];

ports.forEach((port) => {
  try {
    // Get PID using netstat (works on Windows)
    const result = execSync(
      `netstat -ano | findstr :${port}`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
    );

    const lines = result.trim().split('\n');
    const pids = new Set();

    lines.forEach((line) => {
      const parts = line.trim().split(/\s+/);
      // Only kill if it's a LISTENING or ESTABLISHED connection on that exact port
      const addr = parts[1] || '';
      if (addr.endsWith(`:${port}`)) {
        const pid = parts[parts.length - 1];
        if (pid && pid !== '0') pids.add(pid);
      }
    });

    pids.forEach((pid) => {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
        console.log(`✔ Freed port ${port} (killed PID ${pid})`);
      } catch {
        // Process may have already exited
      }
    });
  } catch {
    // Nothing running on this port — that's fine
    console.log(`✔ Port ${port} is already free`);
  }
});
