import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: '/real/',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        TanStackRouterVite({
          routesDirectory: './src/routes',
          generatedRouteTree: './src/routeTree.gen.ts',
          autoCodeSplitting: true,
        }),
        react(),
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              'vendor-react': ['react', 'react-dom'],
              'vendor-tanstack': [
                '@tanstack/react-query',
                '@tanstack/react-router',
                '@tanstack/react-form',
              ],
              'vendor-charts': ['recharts', 'd3-shape', 'd3-scale', 'd3-interpolate'],
              'vendor-jspdf': ['jspdf'],
              'vendor-html2canvas': ['html2canvas'],
              'vendor-gemini': ['@google/generative-ai'],
            },
          },
        },
      },
    };
});
