import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';

const frontendRoot = resolve(process.cwd(), 'frontend');
const pagesDir = resolve(frontendRoot, 'pages');
const pageNames = ['index', 'login', 'signup', 'materials', 'dashboard', 'feedback', 'status'];

const input = Object.fromEntries(
  pageNames
    .filter((name) => existsSync(resolve(pagesDir, `${name}.html`)))
    .map((name) => [name, resolve(pagesDir, `${name}.html`)])
);

export default defineConfig({
  root: frontendRoot,
  build: {
    outDir: resolve(process.cwd(), 'dist'),
    emptyOutDir: true,
    rollupOptions: { input }
  }
});
