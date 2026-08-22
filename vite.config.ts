import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Lets a tenant subdomain (or the platform base domain) resolve locally via a hosts-file
    // entry (e.g. 127.0.0.1 demo.univoapps.com) for testing the domain-resolution feature -
    // Vite otherwise rejects any Host header besides localhost/127.0.0.1 as a security default.
    allowedHosts: ['.univoapps.com'],
  },
})
