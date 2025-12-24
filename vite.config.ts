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
        target: 'esnext',
        minify: 'esbuild',
        cssCodeSplit: true,
        modulePreload: {
          polyfill: true,
        },
        rollupOptions: {
          output: {
            manualChunks(id) {
              // React core
              if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
                return 'vendor-react';
              }
              // Scheduler (React internal)
              if (id.includes('node_modules/scheduler')) {
                return 'vendor-react';
              }
              // TanStack libraries (split by package)
              if (id.includes('@tanstack/react-query')) {
                return 'vendor-tanstack-query';
              }
              if (id.includes('@tanstack/react-router')) {
                return 'vendor-tanstack-router';
              }
              if (id.includes('@tanstack/react-form')) {
                return 'vendor-tanstack-form';
              }
              // Gemini AI
              if (id.includes('@google/generative-ai')) {
                return 'vendor-gemini';
              }
              // Recharts (lazy loaded)
              if (id.includes('recharts') || id.includes('d3-') || id.includes('victory-')) {
                return 'vendor-charts';
              }
              // Lucide icons (split into own chunk)
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              // Date/time libraries
              if (id.includes('date-fns')) {
                return 'vendor-date';
              }
              // Security (DOMPurify)
              if (id.includes('dompurify') || id.includes('isomorphic-dompurify')) {
                return 'vendor-security';
              }
              // Sentry
              if (id.includes('@sentry')) {
                return 'vendor-sentry';
              }
              // Clsx and utility libraries
              if (id.includes('clsx') || id.includes('tailwind-merge') || id.includes('class-variance-authority')) {
                return 'vendor-utils';
              }
            },
          },
          treeshake: {
            preset: 'recommended',
          },
        },
      },
    };
});
