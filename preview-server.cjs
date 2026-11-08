// Local Wi-Fi preview: serves only this workspace's page, without exposing files.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const previewPort = Number(process.argv[2] || 4173);
if (!Number.isInteger(previewPort) || previewPort < 1024 || previewPort > 65535) {
  console.error('Choose a port between 1024 and 65535.');
  process.exit(1);
}
const lanInterfaces = Object.entries(os.networkInterfaces()).flatMap(([name, addresses]) =>
  (addresses || []).filter(address => address.family === 'IPv4' && !address.internal &&
    /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(address.address))
    .map(address => ({ name, address: address.address }))
);
lanInterfaces.sort((a, b) => Number(/wi-?fi|wlan|无线/i.test(b.name)) - Number(/wi-?fi|wlan|无线/i.test(a.name)));
const previewHost = lanInterfaces[0]?.address || '127.0.0.1';
const previewUrl = `http://${previewHost}:${previewPort}/`;
const pageFile = path.join(__dirname, 'index.html');

const server = http.createServer((request, response) => {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    response.end();
    return;
  }
  const pathname = new URL(request.url, previewUrl).pathname;
  if (pathname === '/favicon.ico') {
    response.writeHead(204);
    response.end();
    return;
  }
  if (!['/', '/index.html'].includes(pathname)) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }
  fs.readFile(pageFile, (error, html) => {
    if (error) {
      response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Unable to read index.html');
      return;
    }
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    response.end(request.method === 'HEAD' ? undefined : html);
  });
});
server.on('error', error => {
  console.error(error.code === 'EADDRINUSE'
    ? `Port ${previewPort} is already in use. If preview is running, open ${previewUrl}`
    : `Unable to start preview: ${error.message}`);
  process.exitCode = 1;
});
server.listen(previewPort, previewHost, () => {
  console.log(`Tangyuan workspace: ${previewUrl}`);
  console.log(previewHost === '127.0.0.1'
    ? 'Connect this computer to Wi-Fi, then restart to enable phone access.'
    : 'Connect your phone to the same Wi-Fi and open the address above.');
  console.log('Keep this window and computer running. Press Ctrl+C to stop.');
});
