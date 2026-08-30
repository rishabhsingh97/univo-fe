// Local-dev-only reverse proxy: listens on port 80 and forwards to either the Vite dev server
// (5173) or the Spring Boot backend (8888), picked by the request's Host header, so a
// hosts-file entry like "127.0.0.1 demo.univoapps.com" / "127.0.0.1 localapi.univoapps.com" can
// be visited with no port suffix. Not used in production - Vercel serves the frontend directly
// and the backend has its own real domain (api.univoapps.com), no proxy involved.
//
// Routing by Host (not just blindly forwarding everything to Vite) matters for more than
// convenience: cookie-based auth (see AuthCookieService) sets SameSite=Lax cookies, which the
// browser withholds on cross-site fetch/XHR calls. In production the frontend
// ({tenant}.univoapps.com) and backend (api.univoapps.com) share the same registrable domain, so
// they're same-site and the cookies flow. Locally, without this proxy, the frontend would call
// the backend directly at http://localhost:8888 - a completely different site from
// *.univoapps.com - so the browser would silently drop the auth cookies on every API call after
// login, an infinite bounce back to the login page. Routing localapi.univoapps.com through this
// same port-80 proxy to the real backend keeps the frontend and "backend" on the same site
// locally too.
import http from 'node:http';
import net from 'node:net';

const VITE_HOST = 'localhost';
const VITE_PORT = 5173;
const BACKEND_HOST = 'localhost';
const BACKEND_PORT = 8888;
const LISTEN_PORT = 80;

function targetFor(hostHeader) {
  const host = (hostHeader ?? '').split(':')[0];
  return host === 'localapi.univoapps.com' ? { host: BACKEND_HOST, port: BACKEND_PORT } : { host: VITE_HOST, port: VITE_PORT };
}

const server = http.createServer((req, res) => {
  // A browser tab closing/reloading/navigating away mid-request resets its socket, which
  // otherwise surfaces as an unhandled 'error' event on req/res and crashes the whole proxy
  // process (taking every other in-flight request down with it) - these are expected, harmless
  // client-side disconnects, not something to log or act on.
  req.on('error', () => {});
  res.on('error', () => {});

  const { host, port } = targetFor(req.headers.host);
  const proxyReq = http.request(
    { host, port, path: req.url, method: req.method, headers: req.headers },
    (proxyRes) => {
      proxyRes.on('error', () => {});
      res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
      proxyRes.pipe(res);
    },
  );
  proxyReq.on('error', (err) => {
    if (res.headersSent || res.writableEnded) return;
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end(`Proxy error reaching ${host}:${port} - is it running? (${err.message})`);
  });
  req.pipe(proxyReq);
});

// Same reasoning as req/res above, but for a raw socket that resets before a request is even
// fully parsed (Node's documented hook for this - see the 'clientError' docs).
server.on('clientError', (err, socket) => {
  if (socket.writable) socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

server.on('upgrade', (req, clientSocket, head) => {
  // Now also carries the app's WebSocket messaging traffic (com.univo.config.WebSocketConfig's
  // /ws endpoint), a long-lived connection that's especially likely to get reset by a browser
  // tab reload/close - same unhandled-'error'-crashes-the-proxy risk as the plain HTTP path
  // above, so both sockets need an error listener, not just proxySocket.
  const { host, port } = targetFor(req.headers.host);
  const proxySocket = net.connect(port, host, () => {
    const headerLines = Object.entries(req.headers).map(([key, value]) => `${key}: ${value}`);
    proxySocket.write(`${req.method} ${req.url} HTTP/1.1\r\n${headerLines.join('\r\n')}\r\n\r\n`);
    if (head?.length) proxySocket.write(head);
    proxySocket.pipe(clientSocket);
    clientSocket.pipe(proxySocket);
  });
  clientSocket.on('error', () => proxySocket.destroy());
  proxySocket.on('error', () => clientSocket.destroy());
});

server.listen(LISTEN_PORT, () => {
  console.log(`Dev reverse proxy: http://localhost:${LISTEN_PORT} -> Vite (${VITE_HOST}:${VITE_PORT}) or backend (${BACKEND_HOST}:${BACKEND_PORT}), routed by Host header (localapi.univoapps.com -> backend).`);
  console.log('Add hosts-file entries (e.g. "127.0.0.1 demo.univoapps.com" and "127.0.0.1 localapi.univoapps.com"), then visit either with no port.');
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
