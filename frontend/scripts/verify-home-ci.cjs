const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const root = path.resolve(__dirname, '../site/out');
const prefix = '/ckbadger-explorer';
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (!pathname.startsWith(prefix + '/')) {
    res.writeHead(404);
    return res.end();
  }
  let file = path.resolve(root, '.' + pathname.slice(prefix.length));
  if (!file.startsWith(root + path.sep)) {
    res.writeHead(404);
    return res.end();
  }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, 'index.html');
  const type =
    {
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.html': 'text/html',
      '.svg': 'image/svg+xml',
      '.json': 'application/json',
    }[path.extname(file)] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': type });
  fs.createReadStream(file).pipe(res);
});
server.listen(0, '127.0.0.1', () => {
  const scripts = ['verify-home-containment.cjs', 'verify-ordered-pipeline.cjs'];
  function run(index) {
    if (index === scripts.length) return server.close(() => process.exit(0));
    const child = spawn(process.execPath, [path.join(__dirname, scripts[index])], {
      stdio: 'inherit',
      env: {
        ...process.env,
        PREVIEW_ORIGIN: `http://127.0.0.1:${server.address().port}`,
        DETERMINISTIC: '1',
      },
    });
    child.on('exit', (code) =>
      code === 0 ? run(index + 1) : server.close(() => process.exit(code ?? 1))
    );
  }
  run(0);
});
