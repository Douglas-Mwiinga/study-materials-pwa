import { defineConfig } from 'vite';
import { resolve } from 'node:path';

const frontendRoot = resolve(process.cwd(), 'frontend');


export default defineConfig({
  root: frontendRoot,
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 4173
  },
  build: {
    outDir: 'dist', // Make sure this is 'dist' or your desired output folder
    emptyOutDir: true,
    rollupOptions: {
      // Do not set an input/output that puts index.html in a subfolder
    }
  }
});
