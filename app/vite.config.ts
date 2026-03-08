import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'fs';

// Read version from shared source of truth
const versionFile = readFileSync('../shared/version.ts', 'utf-8');
const version = versionFile.match(/APP_VERSION\s*=\s*'([^']+)'/)?.[1] ?? '0.0.0';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'version-json',
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'version.json',
          source: JSON.stringify({ version }),
        });
      },
    },
  ],
  base: '/tetchess/',
});
