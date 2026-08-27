// Runs Vite and the local-only reverse proxy (dev-proxy.mjs) together under `npm run dev`, so
// testing tenant-subdomain / cookie-auth flows (http://demo.univoapps.com,
// http://localapi.univoapps.com) doesn't need a second terminal running `npm run dev:proxy`
// separately. Local dev only - not referenced by vercel.json or the `build` script.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function run(name, command, args) {
  const child = spawn(command, args, { cwd: root, shell: process.platform === 'win32' });
  const prefix = `[${name}] `;
  const relay = (stream) => (chunk) =>
    stream.write(
      chunk
        .toString()
        .split('\n')
        .filter((line) => line.length > 0)
        .map((line) => prefix + line + '\n')
        .join(''),
    );
  child.stdout.on('data', relay(process.stdout));
  child.stderr.on('data', relay(process.stderr));
  child.on('exit', (code) => {
    if (code) console.error(`${prefix}exited with code ${code}`);
  });
  return child;
}

const children = [run('vite', 'npx', ['vite']), run('proxy', 'node', ['scripts/dev-proxy.mjs'])];

function shutdown() {
  children.forEach((child) => child.kill());
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
