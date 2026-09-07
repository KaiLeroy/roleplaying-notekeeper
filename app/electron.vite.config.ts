import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  main: {
    build: {
      outDir: 'dist-electron',
      emptyOutDir: false,
      lib: { entry: 'electron/main.ts' },
      rollupOptions: { external: ['electron'] }
    }
  },
  preload: {
    build: {
      outDir: 'dist-electron',
      emptyOutDir: false,
      lib: { entry: 'electron/preload.ts' },
      rollupOptions: { external: ['electron'] }
    }
  },
  renderer: {
    root: '.',
    build: {
      outDir: 'dist',
      rollupOptions: { input: 'index.html' }
    },
    plugins: [react()]
  }
});
