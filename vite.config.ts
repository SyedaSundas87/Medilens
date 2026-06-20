import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), tailwindcss()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || "AIzaSyDfQUAwe0Cj9cOV9duHPpfPR_iuY26hTAI"),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || "AIzaSyDfQUAwe0Cj9cOV9duHPpfPR_iuY26hTAI")
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
