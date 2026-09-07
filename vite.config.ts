import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'node22',
    minify: 'oxc',
    outDir: 'dist',
    emptyOutDir: true,

    rolldownOptions: {
      input: 'src/cli.ts',
      external: /^node:/,
      output: {
        entryFileNames: 'cli.js',
      },
    },
  },
});