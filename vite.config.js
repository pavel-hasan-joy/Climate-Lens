import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // MapLibre loads its own web worker; pre-bundling breaks the worker path
  optimizeDeps: { exclude: ['maplibre-gl'] },
});
