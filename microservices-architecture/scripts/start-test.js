const { spawn } = require('child_process');
const http = require('http');
const os = require('os');
const path = require('path');

function log(tag, data) {
  process.stdout.write(`[${tag}] ${data}`);
}

function waitForHttp(url, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tryOnce = () => {
      const req = http.request(url, { method: 'GET' }, res => {
        resolve(true);
        req.destroy();
      });
      req.on('error', () => {
        if (Date.now() - start > timeoutMs) return reject(new Error(`Timeout waiting for ${url}`));
        setTimeout(tryOnce, 1000);
      });
      req.end();
    };
    tryOnce();
  });
}

function startProcess(tag, cmd, args, options = {}) {
  const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], shell: false, ...options });
  child.stdout.on('data', d => log(tag, d));
  child.stderr.on('data', d => log(`${tag}:err`, d));
  child.on('exit', code => log(tag, `exited with code ${code}\n`));
  return child;
}

(async () => {
  const repoRoot = path.resolve(__dirname, '..');

  // 1) Start Teacher Test Server (3009)
  const teacherDir = path.join(repoRoot, 'test-teacher-dashboard');
  startProcess('teacher', process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'start', '--silent'], { cwd: teacherDir });

  // 2) Start LISA (5001) if not already running
  const lisaUrl = 'http://localhost:5001/health';
  let lisaRunning = false;
  try {
    await waitForHttp(lisaUrl, 1500);
    lisaRunning = true;
  } catch (_) {}

  if (!lisaRunning) {
    const lisaDir = path.resolve(repoRoot, '../AMSS/LISA');
    const isWin = process.platform === 'win32';
    const pyPath = isWin
      ? path.join(lisaDir, 'venv', 'Scripts', 'python.exe')
      : path.join(lisaDir, 'venv', 'bin', 'python');
    startProcess('lisa', pyPath, ['LISA2.py'], { cwd: lisaDir, env: { ...process.env, PYTHONUNBUFFERED: '1' } });
  }

  // 3) Start Student Test Server (3010)
  const studentDir = path.join(repoRoot, 'test-student-dashboard');
  const studentEnv = { ...process.env, PORT: '3010', LISA_URL: 'http://localhost:5001' };
  startProcess('student', process.platform === 'win32' ? 'node.exe' : 'node', ['server.js'], { cwd: studentDir, env: studentEnv });

  // Info
  log('info', `\n\nServers starting...\n`);
  log('info', `Teacher:   http://localhost:3009/health\n`);
  log('info', `Student:   http://localhost:3010/ (AMSS Student View)\n`);
  log('info', `Student test page: http://localhost:3010/test/\n`);
  log('info', `LISA:      http://localhost:5001/lisa_prompt\n\n`);
})();


