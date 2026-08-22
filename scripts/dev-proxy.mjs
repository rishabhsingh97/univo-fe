// Local-dev-only reverse proxy: listens on port 80 and forwards everything (including
// WebSocket upgrades, so Vite's HMR still works) to the Vite dev server on 5173. Lets a
// hosts-file entry like "127.0.0.1 demo.univoapps.com" be visited with no port suffix
// (http://demo.univoapps.com instead of http://demo.univoapps.com:5173), which the
// hostname-based tenant resolution feature needs to test realistically. Not used in
// production - Vercel serves the real app directly on 443, no proxy involved.
import http from 'node:http';
import net from 'node:net';

// 'localhost' (not a hardcoded 127.0.0.1) so Node's own resolver picks whichever loopback
// address Vite actually bound to - on this machine that's IPv6 (::1), not IPv4.
const TARGET_HOST = 'localhost';
const TARGET_PORT = 5173;
const LISTEN_PORT = 80;

const server = http.createServer((req, res) => {
  const proxyReq = http.request(
    { host: TARGET_HOST, port: TARGET_PORT, path: req.url, method: req.method, headers: req.headers },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
      proxyRes.pipe(res);
    },
  );
  proxyReq.on('error', (err) => {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end(`Proxy error reaching Vite on :${TARGET_PORT} - is \`npm run dev\` running? (${err.message})`);
  });
  req.pipe(proxyReq);
});

server.on('upgrade', (req, clientSocket, head) => {
  const proxySocket = net.connect(TARGET_PORT, TARGET_HOST, () => {
    const headerLines = Object.entries(req.headers).map(([key, value]) => `${key}: ${value}`);
    proxySocket.write(`${req.method} ${req.url} HTTP/1.1\r\n${headerLines.join('\r\n')}\r\n\r\n`);
    if (head?.length) proxySocket.write(head);
    proxySocket.pipe(clientSocket);
    clientSocket.pipe(proxySocket);
  });
  proxySocket.on('error', () => clientSocket.destroy());
});

server.listen(LISTEN_PORT, () => {
  console.log(`Dev reverse proxy: http://localhost:${LISTEN_PORT} -> http://${TARGET_HOST}:${TARGET_PORT}`);
  console.log('Add a hosts-file entry (e.g. "127.0.0.1 demo.univoapps.com"), then visit it with no port.');
});

server.on('error', (err) => {
  if (err.code === 'EACCES') {
    console.error(`Could not bind to port ${LISTEN_PORT} - try running this from an elevated/Administrator shell.`);
  } else if (err.code === 'EADDRINUSE') {
    console.error(`Port ${LISTEN_PORT} is already in use by something else.`);
  } else {
    console.error(err);
  }
  process.exit(1);
});
