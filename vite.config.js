import { defineConfig } from 'vite';

// Added by Member 1.
// `worker.format: 'es'` is needed because the AI code runs in a module Web Worker
// (src/ai/classifier.worker.js). Without it, the production build can fail.
export default defineConfig({
  worker: { format: 'es' },
});
