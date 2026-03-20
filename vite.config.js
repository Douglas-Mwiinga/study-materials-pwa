import { defineConfig } from 'vite';
import { resolve } from 'node:path';

const frontendRoot = resolve(process.cwd(), 'frontend');


export default defineConfig({
  root: frontendRoot,
  build: {
    outDir: 'dist', // Make sure this is 'dist' or your desired output folder
    emptyOutDir: true,
    rollupOptions: {
      // Do not set an input/output that puts index.html in a subfolder
    }
  }
});
