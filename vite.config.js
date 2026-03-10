import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';

const pagesDir = resolve(process.cwd(), 'frontend/pages');
const pageNames = ['index', 'login', 'signup', 'materials', 'dashboard', 'feedback', 'status'];

const input = Object.fromEntries(
  pageNames
    .filter((name) => existsSync(resolve(pagesDir, `${name}.html`)))
    .map((name) => [name, resolve(pagesDir, `${name}.html`)])
);

export default defineConfig({
  root: pagesDir,
  build: {
    outDir: resolve(process.cwd(), 'dist'),
    emptyOutDir: true,
    rollupOptions: { input }
  }
});
