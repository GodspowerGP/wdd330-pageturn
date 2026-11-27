import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  root: 'src/',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
        tracker: resolve(__dirname, 'src/tracker.html'),
      },
    },
  },
});
