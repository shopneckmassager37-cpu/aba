import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'fs';

// Get all .html files in the root directory
const input = {};
fs.readdirSync(__dirname).forEach(file => {
  if (file.endsWith('.html')) {
    const name = file.replace('.html', '');
    input[name] = resolve(__dirname, file);
  }
});

export default defineConfig({
  build: {
    rollupOptions: {
      input
    }
  }
});
