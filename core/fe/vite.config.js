import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

const DEFAULT_PORT = 5173;

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    resolve: {
      // import x from '@/components/...' thay vi '../../../components'
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      port: Number(env.VITE_PORT) || DEFAULT_PORT,
      strictPort: true,
    },
    test: {
      environment: 'node',
      include: ['src/**/*.test.{js,jsx}'],
    },
  };
});
